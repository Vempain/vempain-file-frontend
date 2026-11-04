import {Dayjs} from "dayjs";

export interface FileThumbnailResponse {
    id: number;
    file_id: number;
    filename: string;
    file_path: string;
    mimetype: string;
    filesize: number;
    sha256sum: string;
    width: number | null;
    height: number | null;
    created: Dayjs;
}