import type {FileResponse} from './FileResponse';

export interface FontFileResponse extends FileResponse {
    font_family: string;
    weight: string;
    style: string;
}