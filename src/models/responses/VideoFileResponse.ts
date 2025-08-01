import type {FileResponse} from './FileResponse';

export interface VideoFileResponse extends FileResponse {
    width: number;
    height: number;
    frame_rate: number;
    duration: number;
    codec: string;
}