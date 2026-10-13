import type {SortDirectionEnum} from "@vempain/vempain-auth-frontend";
import type {FileTypeEnum} from "../FileTypeEnum";

/** Paged request of the metadata summary list; every filter is an optional contains-match (POST /metadata/paged). */
export interface MetadataSearchRequest {
    page: number;
    size: number;
    sort_by?: string;
    direction?: SortDirectionEnum;
    metadata_group?: string;
    metadata_key?: string;
    metadata_value?: string;
    case_sensitive?: boolean;
}

/** Paged request of the files carrying one metadata group, key and value (POST /metadata/files/paged). */
export interface MetadataFilesRequest {
    metadata_group: string;
    metadata_key: string;
    metadata_value: string;
    page: number;
    size: number;
    sort_by?: string;
    direction?: SortDirectionEnum;
    filename?: string;
    file_type?: FileTypeEnum;
}

/** Rewrites the value in every file carrying the group, key and current value; an empty new value removes the entry (POST /metadata/value). */
export interface MetadataValueUpdateRequest {
    metadata_group: string;
    metadata_key: string;
    metadata_value: string;
    new_value: string;
}
