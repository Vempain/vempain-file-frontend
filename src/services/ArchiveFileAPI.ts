import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI.ts";
import type {ArchiveFileResponse} from "../models/responses";

class ArchiveFileAPI extends AbstractAPI<ArchiveFileResponse, ArchiveFileResponse> {
}

export const archiveFileAPI = new ArchiveFileAPI(import.meta.env.VITE_APP_API_URL, "/files/archive");