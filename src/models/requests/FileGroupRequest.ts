export interface FileGroupRequest {
    id: number;
    path: string;
    group_name: string;
    description: string;
    fileIds: number[];
}