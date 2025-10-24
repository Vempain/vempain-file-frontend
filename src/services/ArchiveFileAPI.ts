import type {ArchiveFileResponse} from "../models";
import {AbstractFileAPI} from "./AbstractFileAPI.ts";

class ArchiveFileAPI extends AbstractFileAPI<ArchiveFileResponse, ArchiveFileResponse> {
}

export const archiveFileAPI = new ArchiveFileAPI(import.meta.env.VITE_APP_API_URL, "/files/archive");