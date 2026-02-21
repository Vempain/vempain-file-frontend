import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {PublishAllFileGroupsResponse, PublishFileGroupRequest, PublishFileGroupResponse, PublishProgressResponse} from "../models";

class PublishAPI extends AbstractAPI<PublishFileGroupRequest, PublishFileGroupResponse[]> {
    public async publishFileGroup(publishFileGroupRequest: PublishFileGroupRequest): Promise<PublishFileGroupResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<PublishFileGroupResponse[]>("/file-group", publishFileGroupRequest);
        return response.data;
    }

    public async publishAllFileGroups(): Promise<PublishAllFileGroupsResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PublishAllFileGroupsResponse>("/all-file-groups");
        return response.data;
    }

    public async getPublishProgress(): Promise<PublishProgressResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PublishProgressResponse>("/progress");
        return response.data;
    }
}

export const publishAPI = new PublishAPI(import.meta.env.VITE_APP_API_URL, "/publish");
