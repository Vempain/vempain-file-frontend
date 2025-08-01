import type {FileResponse} from './FileResponse';

export interface IconFileResponse extends FileResponse {
    width: number;
    height: number;
    is_scalable: boolean;
}