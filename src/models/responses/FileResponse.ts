import type {AbstractResponse} from "@vempain/vempain-auth-frontend";
import {Dayjs} from "dayjs";
import type {FileTypeEnum} from "../FileTypeEnum.ts";


export interface FileResponse extends AbstractResponse {
    filename: string;
    file_path: string;
    external_file_id: string;
    mimetype: string;
    filesize: number;
    sha256sum: string;
    original_datetime: Dayjs | null;
    original_second_fraction: number | null;
    original_document_id: string;
    description: string;
    file_type: FileTypeEnum;
    metadata_raw: string;
    rights_holder: string;
    rights_terms: string;
    rights_url: string;
    gps_timestamp: Dayjs | null;
    gps_location_id: number;
    creator_name: string;
    creator_country: string;
    creator_email: string;
    creator_url: string;
    tags: string[];
}