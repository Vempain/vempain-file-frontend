import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI.ts";
import type {DocumentFileResponse} from "../models/responses";

class DocumentFileAPI extends AbstractAPI<DocumentFileResponse, DocumentFileResponse> {
}

export const documentFileAPI = new DocumentFileAPI(import.meta.env.VITE_APP_API_URL, "/files/document");