import type {FileResponse} from './FileResponse';

export interface DocumentFileResponse extends FileResponse {
    page_count: number;
    format: string;
}