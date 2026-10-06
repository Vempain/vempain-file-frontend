import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {taskAPI} from "../../services";
import type {TaskAcceptedResponse, TaskProgressResponse} from "../../models";
import {TaskStatusEnum} from "../../models";
import {TASK_POLL_INTERVAL_MS, TaskProgressProvider, TaskProgressTray, useTaskProgress} from "../../tasks";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => (options ? `${key} ${JSON.stringify(options)}` : key),
    }),
}));

const sessionState: { userSession: { token: string } | null } = {userSession: {token: "token"}};
jest.mock("@vempain/vempain-auth-frontend", () => ({
    useSession: () => sessionState,
}), {virtual: true});

jest.mock("../../services", () => ({
    taskAPI: {
        getTasks: jest.fn(),
        getTask: jest.fn(),
        dismissTask: jest.fn(),
    },
}));

const getTasks = jest.mocked(taskAPI.getTasks);
const getTask = jest.mocked(taskAPI.getTask);
const dismissTask = jest.mocked(taskAPI.dismissTask);

const accepted: TaskAcceptedResponse = {
    task_id: "task-1",
    type: "SCAN_DIRECTORIES",
    title: "Scan /photos",
    status: TaskStatusEnum.QUEUED,
    total_steps: 2,
};

function snapshot(overrides: Partial<TaskProgressResponse>): TaskProgressResponse {
    return {
        task_id: "task-1",
        type: "SCAN_DIRECTORIES",
        title: "Scan /photos",
        status: TaskStatusEnum.RUNNING,
        total_steps: 2,
        completed_steps: 1,
        failed_steps: 0,
        percent: 50,
        message: "Scanned 2024",
        error_message: null,
        result: null,
        created_at: "2026-10-06T10:00:00Z",
        started_at: "2026-10-06T10:00:01Z",
        finished_at: null,
        ...overrides,
    };
}

function Starter({onFinished}: { onFinished: (task: TaskProgressResponse<{ scanned: number }>) => void }) {
    const {trackTask} = useTaskProgress();
    return <button onClick={() => trackTask<{ scanned: number }>(accepted, {onFinished})}>start</button>;
}

describe("TaskProgressProvider and TaskProgressTray", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        getTasks.mockReset();
        getTask.mockReset();
        dismissTask.mockReset();
        getTasks.mockResolvedValue([]);
        sessionState.userSession = {token: "token"};
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("renders nothing while there are no tasks and restores the backend list on mount", async () => {
        getTasks.mockResolvedValueOnce([snapshot({task_id: "restored", title: "Restored task"})]);

        render(<TaskProgressProvider><TaskProgressTray/></TaskProgressProvider>);

        await waitFor(() => expect(screen.getByText("Restored task")).toBeTruthy());
        expect(getTasks).toHaveBeenCalledTimes(1);
    });

    it("tracks an accepted task, polls it to completion, keeps the card and closes it on demand", async () => {
        const onFinished = jest.fn();
        getTask.mockResolvedValueOnce(snapshot({}));
        getTask.mockResolvedValueOnce(snapshot({
            status: TaskStatusEnum.COMPLETED,
            completed_steps: 2,
            percent: 100,
            message: "Scanned 2025",
            result: {scanned: 7},
            finished_at: "2026-10-06T10:00:05Z",
        }));
        dismissTask.mockResolvedValue(undefined);

        render(
                <TaskProgressProvider>
                    <Starter onFinished={onFinished}/>
                    <TaskProgressTray/>
                </TaskProgressProvider>
        );
        await act(async () => {
            await Promise.resolve();
        });

        fireEvent.click(screen.getByText("start"));
        const card = screen.getByTestId("task-card-task-1");
        expect(card.getAttribute("data-status")).toBe(TaskStatusEnum.QUEUED);
        expect(screen.getByText("Scan /photos")).toBeTruthy();
        expect(screen.queryByLabelText("TaskProgress.close")).toBeNull();

        await act(async () => {
            jest.advanceTimersByTime(TASK_POLL_INTERVAL_MS);
            await Promise.resolve();
        });
        expect(getTask).toHaveBeenCalledWith("task-1");
        await waitFor(() => expect(screen.getByTestId("task-card-task-1").getAttribute("data-status")).toBe(TaskStatusEnum.RUNNING));
        expect(onFinished).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(TASK_POLL_INTERVAL_MS);
            await Promise.resolve();
        });
        await waitFor(() => expect(screen.getByTestId("task-card-task-1").getAttribute("data-status")).toBe(TaskStatusEnum.COMPLETED));
        expect(onFinished).toHaveBeenCalledTimes(1);
        expect(onFinished.mock.calls[0][0].result).toEqual({scanned: 7});
        expect(screen.getByText("TaskProgress.completed", {exact: false})).toBeTruthy();

        // Finished tasks are not polled any more but stay visible until closed
        await act(async () => {
            jest.advanceTimersByTime(TASK_POLL_INTERVAL_MS * 2);
            await Promise.resolve();
        });
        expect(getTask).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId("task-card-task-1")).toBeTruthy();

        fireEvent.click(screen.getByLabelText("TaskProgress.close"));
        await waitFor(() => expect(screen.queryByTestId("task-card-task-1")).toBeNull());
        expect(dismissTask).toHaveBeenCalledWith("task-1");
    });

    it("shows the error of a failed task", async () => {
        getTask.mockResolvedValueOnce(snapshot({status: TaskStatusEnum.FAILED, error_message: "Admin backend down", percent: 100}));

        render(
                <TaskProgressProvider>
                    <Starter onFinished={() => undefined}/>
                    <TaskProgressTray/>
                </TaskProgressProvider>
        );
        await act(async () => {
            await Promise.resolve();
        });
        fireEvent.click(screen.getByText("start"));
        await act(async () => {
            jest.advanceTimersByTime(TASK_POLL_INTERVAL_MS);
            await Promise.resolve();
        });

        await waitFor(() => expect(screen.getByText("Admin backend down")).toBeTruthy());
        expect(screen.getByTestId("task-card-task-1").getAttribute("data-status")).toBe(TaskStatusEnum.FAILED);
        expect(screen.getByLabelText("TaskProgress.close")).toBeTruthy();
    });

    it("does not call the backend without a session", async () => {
        sessionState.userSession = null;

        render(<TaskProgressProvider><TaskProgressTray/></TaskProgressProvider>);
        await act(async () => {
            await Promise.resolve();
        });

        expect(getTasks).not.toHaveBeenCalled();
    });
});
