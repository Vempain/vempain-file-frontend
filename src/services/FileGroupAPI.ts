import type {FileGroupListResponse, FileGroupRequest, FileGroupResponse, PagedResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

interface FileGroupQueryParams {
    page?: number;
    size?: number;
    sort?: string;
    direction?: "ASC" | "DESC";
    search?: string;
    caseSensitive?: boolean;
}

class FileGroupAPI extends AbstractAPI<FileGroupRequest, FileGroupResponse> {
    public async findById(id: number): Promise<FileGroupResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<FileGroupResponse>(`/${id}`);
        return response.data;
    }

    public async getFileGroups(params: FileGroupQueryParams = {}): Promise<PagedResponse<FileGroupListResponse>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";

        const {
            page = 0,
            size = 50,
            sort = "path",
            direction = "ASC",
            search,
            caseSensitive = false
        } = params;

        const response = await this.axiosInstance.get<PagedResponse<FileGroupListResponse>>("", {
            params: {
                page,
                size,
                sort,
                direction,
                caseSensitive,
                ...(search ? {search} : {})
            }
        });

        return response.data;
    }

}

export const fileGroupAPI = new FileGroupAPI(import.meta.env.VITE_APP_API_URL, "/file-groups");