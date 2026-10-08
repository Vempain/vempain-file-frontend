import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {PublishFileGroupRequest, TaskAcceptedResponse} from "../models";

/**
 * Publishing runs as background tasks in the file backend: both calls answer with a TaskAcceptedResponse whose task_id is
 * followed through taskAPI / the task progress tray.
 */
export class PublishAPI extends AbstractAPI<PublishFileGroupRequest, TaskAcceptedResponse> {
    public async publishFileGroup(publishFileGroupRequest: PublishFileGroupRequest): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<TaskAcceptedResponse>("/file-group", publishFileGroupRequest);
        return response.data;
    }

    public async publishAllFileGroups(): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<TaskAcceptedResponse>("/all-file-groups");
        return response.data;
    }
}
