import type {PathCompletionRequest, PathCompletionResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

export class PathCompletionAPI extends AbstractAPI<PathCompletionRequest, PathCompletionResponse> {
    public async completePath(request: PathCompletionRequest): Promise<PathCompletionResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<PathCompletionResponse>("", request);
        return response.data;
    }
}
