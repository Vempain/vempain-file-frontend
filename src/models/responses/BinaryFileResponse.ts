import type {FileResponse} from './FileResponse';

export interface BinaryFileResponse extends FileResponse {
    software_name: string;
    software_major_version: number;
}

