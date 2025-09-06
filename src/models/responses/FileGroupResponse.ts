import type {FileResponse} from "./FileResponse.ts";

export interface FileGroupResponse {
    id: number;
    path: string;
    group_name: string;
    files: FileResponse[]
}