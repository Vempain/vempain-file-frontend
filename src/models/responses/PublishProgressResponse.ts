import type {PublishProgressStatusEnum} from "../PublishProgressStatusEnum.ts";

export interface PublishProgressResponse {
    total_groups: number;
    scheduled: number;
    started: number;
    completed: number;
    failed: number;
    // JSON object with group id keys (strings) mapping to status values
    per_group_status: Record<string, PublishProgressStatusEnum>;
    // ISO-8601 timestamp string
    last_updated: string;
}

