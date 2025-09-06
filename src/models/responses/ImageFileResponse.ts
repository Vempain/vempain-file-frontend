import type {FileResponse} from './FileResponse';

export interface ImageFileResponse extends FileResponse {
    width: number;
    height: number;
    color_depth: number;
    dpi: number;
    group_label: string;
}