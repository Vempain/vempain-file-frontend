import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {
    PublishAllFileGroupsRequest,
    PublishFileGroupRequest,
    PublishFileRequest,
    PublishUnitResponse,
    PublishUserResponse,
    TaskAcceptedResponse
} from "../models";

/**
 * Publishing runs as background tasks in the file backend: both publish calls answer with a TaskAcceptedResponse whose task_id is
 * followed through taskAPI / the task progress tray. getPublishUsers and getPublishUnits list the admin-backend users and units a publish
 * may grant access to.
 */
export class PublishAPI extends AbstractAPI<PublishFileGroupRequest, TaskAcceptedResponse> {
    /** Publishes one file as a site file without any gallery; answers with the one-step task */
    public async publishFile(publishFileRequest: PublishFileRequest): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<TaskAcceptedResponse>("/file", publishFileRequest);
        return response.data;
    }

    public async publishFileGroup(publishFileGroupRequest: PublishFileGroupRequest): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<TaskAcceptedResponse>("/file-group", publishFileGroupRequest);
        return response.data;
    }

    public async publishAllFileGroups(request: PublishAllFileGroupsRequest = {}): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<TaskAcceptedResponse>("/all-file-groups", request);
        return response.data;
    }

    public async getPublishUsers(): Promise<PublishUserResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PublishUserResponse[]>("/users");
        return response.data;
    }

    /** The admin-backend units a publish may grant access to, proxied by the file backend like the users */
    public async getPublishUnits(): Promise<PublishUnitResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PublishUnitResponse[]>("/units");
        return response.data;
    }
}
