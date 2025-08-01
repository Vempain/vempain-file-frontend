import type {PathCompletionRequest} from "../models/requests";
import type {PathCompletionResponse} from "../models/responses";
import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI";

export class PathCompletionAPI extends AbstractAPI<PathCompletionRequest, PathCompletionResponse> {
    public async completePath(request: PathCompletionRequest): Promise<PathCompletionResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<PathCompletionResponse>("", request);
        return response.data;
    }
}

export const pathCompletionAPI = new PathCompletionAPI(import.meta.env.VITE_APP_API_URL, "/path-completion");