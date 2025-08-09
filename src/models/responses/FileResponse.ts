import type {AbstractResponse} from "@vempain/vempain-auth-frontend";

export interface FileResponse extends AbstractResponse {
    filename: string;
    file_path: string;
    external_file_id: string;
    mimetype: string;
    filesize: number;
    sha256sum: string;
    original_datetime: string;
    original_second_fraction: number | null;
    original_document_id: string;
    description: string;
    file_type: string;
    metadata_raw: string;
    tags: string[];
}