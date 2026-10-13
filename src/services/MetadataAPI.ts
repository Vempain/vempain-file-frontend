import type {
    FileResponse,
    MetadataFilesRequest,
    MetadataSearchRequest,
    MetadataSummaryResponse,
    MetadataValueUpdateRequest,
    TaskAcceptedResponse
} from "../models";
import {AbstractAPI, type PagedResponse} from "@vempain/vempain-auth-frontend";

/**
 * Client of the file backend's metadata API (`/metadata`): the distinct group/key/value rows of the `metadata` table, the files
 * carrying one of them and the background rewrite of a value. The generic create/update/delete of {@link AbstractAPI} are not
 * served by the backend; only the methods below exist.
 */
export class MetadataAPI extends AbstractAPI<never, MetadataSummaryResponse> {
    /** Distinct group, key and value rows with file counts, filtered by group, key and/or value (counts are system wide). */
    public findSummaries(request: MetadataSearchRequest): Promise<PagedResponse<MetadataSummaryResponse>> {
        return this.postJson<PagedResponse<MetadataSummaryResponse>>("paged", request);
    }

    /** The files the user may read that carry one group, key and value, filtered by file name and type. */
    public findFiles(request: MetadataFilesRequest): Promise<PagedResponse<FileResponse>> {
        return this.postJson<PagedResponse<FileResponse>>("files/paged", request);
    }

    /** Background task (one step per file): rewrites the value in every file carrying it; an empty new value removes the entry. */
    public updateValue(request: MetadataValueUpdateRequest): Promise<TaskAcceptedResponse> {
        return this.postJson<TaskAcceptedResponse>("value", request);
    }

    private postJson<T>(path: string, body: unknown): Promise<T> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
        return this.axiosInstance.post<T>(path, body).then(response => response.data);
    }
}
