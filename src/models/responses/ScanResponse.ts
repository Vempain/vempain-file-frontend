// models/Responses.ts

export interface ScanResponse {
    success: boolean;
    errorMessage: string | null;
    scannedFilesCount: number;
    newFilesCount: number;
    successfulFiles: string[];
    failedFiles: string[];
}