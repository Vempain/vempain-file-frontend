/** One distinct metadata group, key and value combination with the number of files carrying it (POST /metadata/paged). */
export interface MetadataSummaryResponse {
    metadata_group: string;
    metadata_key: string;
    metadata_value: string;
    file_count: number;
    /** False for read-only ExifTool groups (File, System, Composite, ExifTool); the value can not be rewritten */
    writable: boolean;
}
