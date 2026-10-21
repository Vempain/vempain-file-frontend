import type {FileResponse} from "./FileResponse.ts";

export interface FileGroupResponse {
    id: number;
    path: string;
    group_name: string;
    description: string;
    /** The gallery the group was last published as in the admin backend; null when never published */
    gallery_id?: number | null;
    files?: FileResponse[]
}