import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {DataRequest, DataResponse, DataSummaryResponse} from "../models";

export class DataAPI extends AbstractAPI<DataRequest, DataResponse> {
    public async getAllDataSets(): Promise<DataSummaryResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<DataSummaryResponse[]>("");
        return response.data;
    }

    public async getDataSetByIdentifier(identifier: string): Promise<DataResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<DataResponse>(`/${identifier}`);
        return response.data;
    }

    public async createDataSet(dataRequest: DataRequest): Promise<DataResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<DataResponse>("", dataRequest);
        return response.data;
    }

    public async updateDataSet(dataRequest: DataRequest): Promise<DataResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.put<DataResponse>("", dataRequest);
        return response.data;
    }

    public async publishDataSet(identifier: string): Promise<DataResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<DataResponse>(`/${identifier}/publish`, null);
        return response.data;
    }
}
