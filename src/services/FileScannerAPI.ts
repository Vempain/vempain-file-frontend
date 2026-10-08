import type {ScanRequest, TaskAcceptedResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

/**
 * Directory scans run as background tasks; the finished task carries a ScanResponses result.
 */
export class FileScannerAPI extends AbstractAPI<ScanRequest, TaskAcceptedResponse> {
    public async scanDirectory(scanRequest: ScanRequest): Promise<TaskAcceptedResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<TaskAcceptedResponse>("", scanRequest);
        return response.data;
    }
}
