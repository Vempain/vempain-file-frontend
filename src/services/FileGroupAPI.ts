import type {FileGroupListResponse, FileGroupRequest, FileGroupResponse} from "../models";
import {AbstractAPI, type PagedRequest, type PagedResponse} from "@vempain/vempain-auth-frontend";

class FileGroupAPI extends AbstractAPI<FileGroupRequest, FileGroupResponse> {
    public async findById(id: number): Promise<FileGroupResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<FileGroupResponse>(`/${id}`);
        return response.data;
    }

    public async getFileGroups(pagedRequest: PagedRequest): Promise<PagedResponse<FileGroupListResponse>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
        
        const response = await this.axiosInstance.post<PagedResponse<FileGroupListResponse>>("/paged", pagedRequest);

        return response.data;
    }
}

export const fileGroupAPI = new FileGroupAPI(import.meta.env.VITE_APP_API_URL, "/file-groups");