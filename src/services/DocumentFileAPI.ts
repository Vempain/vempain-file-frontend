import type {DocumentFileResponse} from "../models";
import {AbstractFileAPI} from "./AbstractFileAPI.ts";

class DocumentFileAPI extends AbstractFileAPI<DocumentFileResponse, DocumentFileResponse> {
}

export const documentFileAPI = new DocumentFileAPI(import.meta.env.VITE_APP_API_URL, "/files/document");