import type {DocumentFileResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class DocumentFileAPI extends AbstractAPI<DocumentFileResponse, DocumentFileResponse> {
}

export const documentFileAPI = new DocumentFileAPI(import.meta.env.VITE_APP_API_URL, "/files/document");