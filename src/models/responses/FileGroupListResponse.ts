export interface FileGroupListResponse {
    id: number;
    path: string;
    group_name: string;
    description: string;
    file_count: number;
    /** How many files of the group have an exported file; only these are transferred when the group is published */
    exported_file_count: number;
    gallery_id: number | null;
}