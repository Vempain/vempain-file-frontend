import type {PagedResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

export abstract class AbstractFileAPI<REQUEST, RESPONSE> extends AbstractAPI<REQUEST, RESPONSE> {
    public async findAllPageable(page: number, size: number): Promise<PagedResponse<RESPONSE>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";

        const response = await this.axiosInstance.get<PagedResponse<RESPONSE>>("", {
            params: {page, size},
        });

        return response.data;
    }
}