export interface FileGroupRequest {
    id: number;
    path: string;
    group_name: string;
    description: string;
    file_ids: number[];
}