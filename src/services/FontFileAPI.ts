import type {FontFileResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class FontFileAPI extends AbstractAPI<FontFileResponse, FontFileResponse> {
}

export const fontFileAPI = new FontFileAPI(import.meta.env.VITE_APP_API_URL, "/files/font");