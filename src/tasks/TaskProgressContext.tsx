import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useSession} from "@vempain/vempain-auth-frontend";
import {taskAPI} from "../services";
import {isTaskFinished, type TaskAcceptedResponse, type TaskProgressResponse} from "../models";
import {readClosedTaskIds, TASK_POLL_INTERVAL_MS, writeClosedTaskIds} from "./TaskProgressConfig";
import {type TaskFinishedCallback, taskProgressContext, type TaskProgressContextValue, type TrackTaskOptions} from "./TaskProgressContextValue";

function fromAccepted(accepted: TaskAcceptedResponse): TaskProgressResponse {
    return {
        task_id: accepted.task_id,
        type: accepted.type,
        title: accepted.title,
        status: accepted.status,
        total_steps: accepted.total_steps,
        completed_steps: 0,
        failed_steps: 0,
        percent: 0,
        cancel_requested: false,
        reverted_steps: 0,
        message: null,
        error_message: null,
        result: null,
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
    };
}

function sortNewestFirst(tasks: TaskProgressResponse[]): TaskProgressResponse[] {
    return [...tasks].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Keeps the list of background tasks of the signed-in user, polls the running ones and notifies callers when a task finishes.
 * Closing a card only hides it; cancelling asks the backend to stop the task and revert its changes.
 * Designed to be extracted into a shared component: it only depends on the task API client and the task models.
 */
export function TaskProgressProvider({children}: { children: ReactNode }) {
    const {userSession} = useSession();
    const [tasks, setTasks] = useState<TaskProgressResponse[]>([]);
    const [closedIds, setClosedIds] = useState<Set<string>>(() => readClosedTaskIds());
    const callbacks = useRef<Map<string, TaskFinishedCallback<never>>>(new Map());
    const signedIn = Boolean(userSession);

    const upsert = useCallback((task: TaskProgressResponse) => {
        setTasks(previous => sortNewestFirst([...previous.filter(existing => existing.task_id !== task.task_id), task]));
    }, []);

    const settle = useCallback((task: TaskProgressResponse) => {
        upsert(task);
        if (isTaskFinished(task.status)) {
            const callback = callbacks.current.get(task.task_id);
            if (callback) {
                callbacks.current.delete(task.task_id);
                (callback as TaskFinishedCallback)(task);
            }
        }
    }, [upsert]);

    const refresh = useCallback(async () => {
        if (!signedIn) {
            return;
        }
        try {
            const restored = await taskAPI.getTasks();
            setTasks(sortNewestFirst(restored));
        } catch (error) {
            console.error("Failed to load background tasks", error);
        }
    }, [signedIn]);

    const trackTask = useCallback(<R, >(accepted: TaskAcceptedResponse, options?: TrackTaskOptions<R>) => {
        if (options?.onFinished) {
            callbacks.current.set(accepted.task_id, options.onFinished as TaskFinishedCallback<never>);
        }
        upsert(fromAccepted(accepted));
    }, [upsert]);

    const closeTask = useCallback((taskId: string) => {
        const task = tasks.find(candidate => candidate.task_id === taskId);
        setClosedIds(previous => {
            const next = new Set(previous);
            next.add(taskId);
            writeClosedTaskIds(next);
            return next;
        });
        if (task && isTaskFinished(task.status)) {
            // A finished task is gone for good; a running one must stay in the backend list
            callbacks.current.delete(taskId);
            setTasks(previous => previous.filter(candidate => candidate.task_id !== taskId));
            taskAPI.dismissTask(taskId)
                    .catch((error: unknown) => console.error("Failed to dismiss background task " + taskId, error));
        }
    }, [tasks]);

    const cancelTask = useCallback(async (taskId: string) => {
        const snapshot = await taskAPI.cancelTask(taskId);
        settle(snapshot);
    }, [settle]);

    // Restore the list after a reload or a login, drop it on logout
    useEffect(() => {
        if (signedIn) {
            void refresh();
        } else {
            setTasks([]);
            callbacks.current.clear();
        }
    }, [signedIn, refresh]);

    // Drop the closed-id bookkeeping of tasks that are no longer tracked at all
    useEffect(() => {
        if (closedIds.size === 0) {
            return;
        }
        const known = new Set(tasks.map(task => task.task_id));
        const stale = [...closedIds].filter(id => !known.has(id));
        if (stale.length > 0 && tasks.length > 0) {
            setClosedIds(previous => {
                const next = new Set([...previous].filter(id => known.has(id)));
                writeClosedTaskIds(next);
                return next;
            });
        }
    }, [tasks, closedIds]);

    // Poll the unfinished tasks, closed cards included, so that their onFinished callbacks still fire
    const activeIds = useMemo(() => tasks.filter(task => !isTaskFinished(task.status)).map(task => task.task_id), [tasks]);
    useEffect(() => {
        if (!signedIn || activeIds.length === 0) {
            return;
        }
        let cancelled = false;
        const timer = window.setInterval(() => {
            activeIds.forEach(taskId => {
                taskAPI.getTask(taskId)
                        .then(task => {
                            if (!cancelled) {
                                settle(task);
                            }
                        })
                        .catch((error: unknown) => {
                            console.error("Failed to poll background task " + taskId, error);
                        });
            });
        }, TASK_POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [activeIds, settle, signedIn]);

    const visibleTasks = useMemo(() => tasks.filter(task => !closedIds.has(task.task_id)), [tasks, closedIds]);
    const value = useMemo<TaskProgressContextValue>(() => ({tasks: visibleTasks, trackTask, closeTask, cancelTask, refresh}),
            [visibleTasks, trackTask, closeTask, cancelTask, refresh]);

    return <taskProgressContext.Provider value={value}>{children}</taskProgressContext.Provider>;
}
