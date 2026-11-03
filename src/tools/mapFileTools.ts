import dayjs from "dayjs";
import type {MapFileResponse} from "@vempain/vempain-common-frontend";
import type {FileResponse} from "../models";
import type {FileTypeEnum} from "../models/FileTypeEnum";

/** The map file as the details view of the typed file lists reads it */
export function toFileDetails(file: MapFileResponse): Partial<FileResponse> {
    return {
        id: file.id,
        filename: file.filename,
        file_path: file.file_path,
        mimetype: file.mimetype,
        file_type: file.file_type as FileTypeEnum,
        original_datetime: file.original_datetime ? dayjs(file.original_datetime) : null,
        location: {
            latitude: Math.abs(file.latitude),
            latitude_ref: file.latitude < 0 ? "S" : "N",
            longitude: Math.abs(file.longitude),
            longitude_ref: file.longitude < 0 ? "W" : "E"
        } as FileResponse["location"]
    };
}

