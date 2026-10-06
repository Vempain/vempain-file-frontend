import {createContext} from "react";
import type {TaskAcceptedResponse, TaskProgressResponse} from "../models";

export type TaskFinishedCallback<R = unknown> = (task: TaskProgressResponse<R>) => void;

export interface TrackTaskOptions<R = unknown> {
    /** Invoked once, when the task reaches COMPLETED or FAILED. Receives the final snapshot including the result payload. */
    onFinished?: TaskFinishedCallback<R>;
}

export interface TaskProgressContextValue {
    /** Tracked tasks, newest first. Finished tasks stay listed until the user dismisses them. */
    tasks: TaskProgressResponse[];
    /** Starts following a task that an endpoint has just accepted (202). */
    trackTask: <R = unknown>(accepted: TaskAcceptedResponse, options?: TrackTaskOptions<R>) => void;
    /** Removes a finished task from the tray and from the backend list. */
    dismissTask: (taskId: string) => Promise<void>;
    /** Re-reads the task list of the current user from the backend. */
    refresh: () => Promise<void>;
}

export const taskProgressContext = createContext<TaskProgressContextValue | null>(null);
