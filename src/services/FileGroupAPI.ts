import type {FileGroupListResponse, FileGroupRequest, FileGroupResponse, PagedResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class FileGroupAPI extends AbstractAPI<FileGroupRequest, FileGroupResponse> {
    public async findById(id: number): Promise<FileGroupResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<FileGroupResponse>(`/${id}`);
        return response.data;
    }

    public async findAllPageable(page: number, size: number): Promise<PagedResponse<FileGroupListResponse>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";

        const response = await this.axiosInstance.get<PagedResponse<FileGroupListResponse>>("", {
            params: {page, size},
        });

        return response.data;
    }

}

export const fileGroupAPI = new FileGroupAPI(import.meta.env.VITE_APP_API_URL, "/file-groups");