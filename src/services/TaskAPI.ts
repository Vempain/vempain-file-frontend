import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {TaskProgressResponse} from "../models";

/**
 * Progress callback API of background tasks (/tasks). Tasks are private to the user who started them.
 */
export class TaskAPI extends AbstractAPI<unknown, TaskProgressResponse> {
    /** Running and recently finished tasks of the current user, newest first. */
    public async getTasks(): Promise<TaskProgressResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<TaskProgressResponse[]>("");
        return response.data;
    }

    public async getTask<R = unknown>(taskId: string): Promise<TaskProgressResponse<R>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<TaskProgressResponse<R>>("/" + encodeURIComponent(taskId));
        return response.data;
    }

    /** Removes a finished task from the list; the backend answers 409 while the task is still running. */
    public async dismissTask(taskId: string): Promise<void> {
        this.setAuthorizationHeader();
        await this.axiosInstance.delete<void>("/" + encodeURIComponent(taskId));
    }
}
