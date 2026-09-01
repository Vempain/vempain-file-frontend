import {AdminAPI} from "./AdminAPI";
import {resolveAdminApiUrl} from "./resolveAdminApiUrl";

export interface ScheduleTriggerResponse {
    id: number;
    schedule_name: string;
    status: string;
}

export interface PublishScheduleResponse {
    id: number;
    publish_time: string;
    publish_status: string;
    publish_message: string;
    publish_type: string;
    publish_id: number;
    created_at?: string;
    updated_at?: string;
}

export interface FileImportScheduleResponse {
    id: number;
    source_directory: string;
    destination_directory: string;
    generate_gallery: boolean;
    gallery_shortname?: string;
    gallery_description?: string;
    generate_page: boolean;
    page_title?: string;
    page_path?: string;
    page_body?: string;
    page_form_id?: number;
}

export interface TriggerSystemScheduleRequest {
    schedule_name: string;
    delay: number;
}

export interface TriggerPublishScheduleRequest {
    id: number;
    publish_time: string;
    publish_status: string;
    publish_message: string;
    publish_type: string;
    publish_id: number;
}

class AdminScheduleAPI extends AdminAPI<TriggerSystemScheduleRequest, ScheduleTriggerResponse> {
    public getSystemSchedules(): Promise<ScheduleTriggerResponse[]> {
        this.setAuthorizationHeader();
        return this.axiosInstance.get<ScheduleTriggerResponse[]>("/system-schedules").then(response => response.data);
    }

    public triggerSystemSchedule(request: TriggerSystemScheduleRequest): Promise<ScheduleTriggerResponse> {
        this.setAuthorizationHeader();
        return this.axiosInstance.post<ScheduleTriggerResponse>("/system-schedules", request).then(response => response.data);
    }

    public getPublishingSchedules(): Promise<PublishScheduleResponse[]> {
        this.setAuthorizationHeader();
        return this.axiosInstance.get<PublishScheduleResponse[]>("/publishing").then(response => response.data);
    }

    public triggerPublishingSchedule(request: TriggerPublishScheduleRequest): Promise<PublishScheduleResponse> {
        this.setAuthorizationHeader();
        return this.axiosInstance.post<PublishScheduleResponse>("/publishing", request).then(response => response.data);
    }

    public getFileImportSchedules(): Promise<FileImportScheduleResponse[]> {
        this.setAuthorizationHeader();
        return this.axiosInstance.get<FileImportScheduleResponse[]>("/file-imports").then(response => response.data);
    }
}

export const adminScheduleAPI = new AdminScheduleAPI(resolveAdminApiUrl(), "/schedule-management");
