// services/TagAPI.ts
import type {FileResponse, TagOperationRequest, TagRequest, TagResponse} from "../models";
import {AbstractAPI, type PagedRequest, type PagedResponse} from "@vempain/vempain-auth-frontend";

export class TagAPI extends AbstractAPI<TagRequest, TagResponse> {
    public findFilesPageable(tagId: number, pagedRequest: PagedRequest): Promise<PagedResponse<FileResponse>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
        return this.axiosInstance.post<PagedResponse<FileResponse>>(`${tagId}/files/paged`, pagedRequest)
            .then(response => response.data);
    }

    public addTag(request: TagOperationRequest) {
        return this.postOperation("files/add", request);
    }

    public removeTag(request: TagOperationRequest) {
        return this.postOperation("files/remove", request);
    }

    public replaceTag(request: TagOperationRequest) {
        return this.postOperation("files/replace", request);
    }

    public renameTag(request: TagOperationRequest) {
        return this.postOperation("files/rename", request);
    }

    public removeTagFromAll(request: TagOperationRequest) {
        return this.postOperation("all/remove", request);
    }

    public replaceTagAcrossAll(request: TagOperationRequest) {
        return this.postOperation("all/replace", request);
    }

    public renameTagAcrossAll(request: TagOperationRequest) {
        return this.postOperation("all/rename", request);
    }

    private postOperation(path: string, request: TagOperationRequest): Promise<void> {
        this.setAuthorizationHeader();
        return this.axiosInstance.post<void>(path, request).then(response => response.data);
    }
}
