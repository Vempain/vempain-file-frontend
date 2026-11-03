import {AbstractAPI, type PagedResponse} from "@vempain/vempain-auth-frontend";
import type {
    CreateGpsTimeSeriesRequest,
    DataPagedRequest,
    DataSummaryResponse,
    PublishAclRequest,
    PublishDataSetStatusResponse,
    PublishMusicDatasetRequest,
    TaskAcceptedResponse
} from "../models";

/**
 * DataAPI provides access to the /data-publish endpoints.
 *
 * Overrides the default auth interceptor so that 403 responses
 * do NOT terminate the session.  Only genuine 401 responses trigger logout.
 */
export class DataAPI extends AbstractAPI<unknown, TaskAcceptedResponse> {
    constructor(baseURL: string, member: string) {
        super(baseURL, member);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mgr = this.axiosInstance?.interceptors?.response as any;
            if (mgr?.handlers) {
                mgr.handlers.forEach((_: unknown, idx: number) => {
                    this.axiosInstance.interceptors.response.eject(idx);
                });
            }
            if (this.axiosInstance?.interceptors?.response) {
                this.axiosInstance.interceptors.response.use(
                    (response) => response,
                    (error) => Promise.reject(error),
                );
            }
        } catch {
            // In test environments the interceptors manager may not be available
        }
    }

    /**
     * POST /data-publish/music. Starts a background task whose result is the admin DataResponse; with `publishToSite` the task also starts the
     * admin backend's publishing of the data set to the website. `acls` names the admin users and units granted privileges on the data set
     * (a list replaces the grantees of an existing set, null leaves them untouched).
     */
    public async publishMusic(publishToSite: boolean = false, acls: PublishAclRequest[] | null = null): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const request: PublishMusicDatasetRequest = {publish_to_site: publishToSite, acls};
        const response = await this.axiosInstance.post<TaskAcceptedResponse>("/music", request);
        return response.data;
    }

    /**
     * POST /data-publish/gps-timeseries. Starts a background task whose result is the admin DataResponse; with `publishToSite` the task also
     * starts the admin backend's publishing of the data set to the website. `acls` as in {@link publishMusic}.
     */
    public async publishGpsTimeSeries(fileGroupId: number, timeSeriesName: string, publishToSite: boolean = false,
                                      acls: PublishAclRequest[] | null = null): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const request: CreateGpsTimeSeriesRequest = {
            file_group_id: fileGroupId,
            time_series_name: timeSeriesName,
            publish_to_site: publishToSite,
            acls,
        };
        const response = await this.axiosInstance.post<TaskAcceptedResponse>("/gps-timeseries", request);
        return response.data;
    }

    /** POST /data-publish/paged: the data sets of the admin backend filtered, sorted and paged there, for the data set table */
    public async findPageableDataSets(request: DataPagedRequest): Promise<PagedResponse<DataSummaryResponse>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<PagedResponse<DataSummaryResponse>>("/paged", request);
        return response.data;
    }

    /** GET /data-publish/{identifier}/status: whether the admin backend holds the data set already and who was granted privileges on it */
    public async getDataSetStatus(identifier: string): Promise<PublishDataSetStatusResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PublishDataSetStatusResponse>(`/${encodeURIComponent(identifier)}/status`);
        return response.data;
    }
}
