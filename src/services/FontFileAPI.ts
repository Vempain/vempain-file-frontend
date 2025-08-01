import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI.ts";
import type {FontFileResponse} from "../models/responses";

class FontFileAPI extends AbstractAPI<FontFileResponse, FontFileResponse> {
}

export const fontFileAPI = new FontFileAPI(import.meta.env.VITE_APP_API_URL, "/files/font");