import type {ExportFileResponse} from "./ExportFileResponse.ts";

export interface ExportScanResponse {
    success: boolean;
    error_message: string | null;
    scanned_files_count: number;
    new_files_count: number;
    successful_files: ExportFileResponse[];
    failed_files: string[];
}
