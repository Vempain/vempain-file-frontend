// services/TagAPI.ts
import type {FileResponse, TagOperationRequest, TagRequest, TagResponse, TaskAcceptedResponse} from "../models";
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

    /** Background task (one step per tagged file). */
    public removeTagFromAll(request: TagOperationRequest): Promise<TaskAcceptedResponse> {
        return this.postTaskOperation("all/remove", request);
    }

    /** Background task (one step per tagged file). */
    public replaceTagAcrossAll(request: TagOperationRequest): Promise<TaskAcceptedResponse> {
        return this.postTaskOperation("all/replace", request);
    }

    /** Background task (one step per tagged file). */
    public renameTagAcrossAll(request: TagOperationRequest): Promise<TaskAcceptedResponse> {
        return this.postTaskOperation("all/rename", request);
    }

    private postTaskOperation(path: string, request: TagOperationRequest): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        return this.axiosInstance.post<TaskAcceptedResponse>(path, request).then(response => response.data);
    }

    private postOperation(path: string, request: TagOperationRequest): Promise<void> {
        this.setAuthorizationHeader();
        return this.axiosInstance.post<void>(path, request).then(response => response.data);
    }
}
