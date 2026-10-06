import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {CreateGpsTimeSeriesRequest, TaskAcceptedResponse} from "../models";

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
     * POST /data-publish/music. Starts a background task whose result is the admin DataResponse.
     */
    public async publishMusic(): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<TaskAcceptedResponse>("/music", null);
        return response.data;
    }

    /**
     * POST /data-publish/gps-timeseries. Starts a background task whose result is the admin DataResponse.
     */
    public async publishGpsTimeSeries(fileGroupId: number, timeSeriesName: string): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const request: CreateGpsTimeSeriesRequest = {
            file_group_id: fileGroupId,
            time_series_name: timeSeriesName,
        };
        const response = await this.axiosInstance.post<TaskAcceptedResponse>("/gps-timeseries", request);
        return response.data;
    }
}
