export interface FileGroupListResponse {
    id: number;
    path: string;
    group_name: string;
    description: string;
    file_count: number;
    gallery_id: number | null;
}