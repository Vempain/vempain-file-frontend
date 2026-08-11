import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {FileStatisticsResponse} from "../models";

export class StatisticsAPI extends AbstractAPI<never, FileStatisticsResponse> {
    public async getStatistics(): Promise<FileStatisticsResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<FileStatisticsResponse>("");
        return response.data;
    }
}
