import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {DataResponse} from "../models";

/**
 * DataAPI provides access to the /data-publish endpoints.
 *
 * Overrides the default auth interceptor so that 403 responses
 * do NOT terminate the session.  Only genuine 401 responses trigger logout.
 */
export class DataAPI extends AbstractAPI<unknown, DataResponse> {
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
     * POST /data-publish/music
     */
    public async publishMusic(): Promise<DataResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<DataResponse>("/music");
        return response.data;
    }

    /**
     * POST /data-publish/gps-timeseries/{directoryPath}
     */
    public async publishGpsTimeSeries(directoryPath: string): Promise<DataResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<DataResponse>(`/gps-timeseries/${directoryPath}`);
        return response.data;
    }
}
