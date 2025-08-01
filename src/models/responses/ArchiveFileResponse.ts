import type {FileResponse} from './FileResponse';

export interface ArchiveFileResponse extends FileResponse {
    compression_method: string;
    uncompressed_size: number;
    content_count: number;
    is_encrypted: boolean;
}