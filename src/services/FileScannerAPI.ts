import type {ScanRequest} from "../models/requests";
import type {ScanResponse} from "../models/responses";
import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI.ts";

class FileScannerAPI extends AbstractAPI<ScanRequest, ScanResponse> {
    public async scanDirectory(scanRequest: ScanRequest): Promise<ScanResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<ScanResponse>("", scanRequest);
        return response.data;
    }
}

export const fileScannerAPI = new FileScannerAPI(import.meta.env.VITE_APP_API_URL, "/scan-files");