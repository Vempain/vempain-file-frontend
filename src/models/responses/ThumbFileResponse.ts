import type {FileResponse} from './FileResponse';

export interface ThumbFileResponse extends FileResponse {
    relation_type: string;
    target_file_id: number;
}

