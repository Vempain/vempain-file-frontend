import type {FileResponse} from './FileResponse';

export interface VectorFileResponse extends FileResponse {
    width: number;
    height: number;
    layers_count: number;
}