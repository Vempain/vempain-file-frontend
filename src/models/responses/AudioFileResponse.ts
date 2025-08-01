import type {FileResponse} from './FileResponse';

export interface AudioFileResponse extends FileResponse {
    duration: number;
    bit_rate: number;
    sample_rate: number;
    codec: string;
    channels: number;
}