import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {
    PublishAllFileGroupsRequest,
    PublishFileGroupRequest,
    PublishFileGroupStatusResponse,
    PublishFileRequest,
    PublishFileStatusResponse,
    PublishUnitResponse,
    PublishUserResponse,
    TaskAcceptedResponse
} from "../models";

/**
 * Publishing runs as background tasks in the file backend: both publish calls answer with a TaskAcceptedResponse whose task_id is
 * followed through taskAPI / the task progress tray. getPublishUsers and getPublishUnits list the admin-backend users and units a publish
 * may grant access to; getFileStatus and getFileGroupStatus tell whether a file or group was published before and who was granted
 * access the last time, so that the publish dialogs can prefill their ACL rows.
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

    /** Whether the file was published before and the grantees of its site file; the file backend asks the admin backend */
    public async getFileStatus(fileId: number): Promise<PublishFileStatusResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PublishFileStatusResponse>(`/file/${fileId}/status`);
        return response.data;
    }

    /** Whether the file group was published before, as which gallery with which site files, and the grantees of the gallery */
    public async getFileGroupStatus(fileGroupId: number): Promise<PublishFileGroupStatusResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PublishFileGroupStatusResponse>(`/file-group/${fileGroupId}/status`);
        return response.data;
    }
}
