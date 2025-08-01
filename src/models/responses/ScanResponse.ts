// models/Responses.ts

import type {FileResponse} from "./FileResponse.ts";

export interface ScanResponse {
    success: boolean;
    error_message: string | null;
    scanned_files_count: number;
    new_files_count: number;
    successful_files: FileResponse[];
    failed_files: string[];
}