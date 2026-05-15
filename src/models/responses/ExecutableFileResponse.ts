import type {FileResponse} from './FileResponse';

export interface ExecutableFileResponse extends FileResponse {
    operating_systems: string[];
    script: boolean;
}

