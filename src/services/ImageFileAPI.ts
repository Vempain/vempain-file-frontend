import type {ImageFileResponse, PagedResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class ImageFileAPI extends AbstractAPI<ImageFileResponse, ImageFileResponse> {
    public async findAllPageable(page: number, size: number): Promise<PagedResponse<ImageFileResponse>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";

        const response = await this.axiosInstance.get<PagedResponse<ImageFileResponse>>("", {
            params: {page, size},
        });

        return response.data;
    }
}

export const imageFileAPI = new ImageFileAPI(import.meta.env.VITE_APP_API_URL, "/files/image");