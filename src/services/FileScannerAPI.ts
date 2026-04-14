import type {ScanRequest, ScanResponses} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

export class FileScannerAPI extends AbstractAPI<ScanRequest, ScanResponses> {
    public async scanDirectory(scanRequest: ScanRequest): Promise<ScanResponses> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<ScanResponses>("", scanRequest);
        return response.data;
    }
}
