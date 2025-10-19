import type {ArchiveFileResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class ArchiveFileAPI extends AbstractAPI<ArchiveFileResponse, ArchiveFileResponse> {
}

export const archiveFileAPI = new ArchiveFileAPI(import.meta.env.VITE_APP_API_URL, "/files/archive");