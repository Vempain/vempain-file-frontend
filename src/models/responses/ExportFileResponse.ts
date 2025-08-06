export interface ExportFileResponse {
    id: number;
    file_id: number;
    filename: string;
    file_path: string;
    mimetype: string;
    filesize: number;
    sha256sum: string;
    original_document_id: string | null;
    created: string;
}