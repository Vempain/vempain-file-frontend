import {AbstractAPI, type PagedRequest, type PagedResponse} from "@vempain/vempain-auth-frontend";

export abstract class AbstractFileAPI<REQUEST, RESPONSE> extends AbstractAPI<REQUEST, RESPONSE> {
    public async findAllPageable(pagedRequest: PagedRequest): Promise<PagedResponse<RESPONSE>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";

        const response = await this.axiosInstance.post<PagedResponse<RESPONSE>>("paged", pagedRequest);

        return response.data;
    }
}