import type {OriginalScanResponse} from "./OriginalScanResponse.ts";
import type {ExportScanResponse} from "./ExportScanResponse.ts";

export interface ScanResponses {
    scan_original_response: OriginalScanResponse;
    scan_export_response: ExportScanResponse;
}