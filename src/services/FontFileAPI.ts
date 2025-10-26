import type {FontFileResponse} from "../models";
import {AbstractFileAPI} from "./AbstractFileAPI.ts";

class FontFileAPI extends AbstractFileAPI<FontFileResponse, FontFileResponse> {
}

export const fontFileAPI = new FontFileAPI(import.meta.env.VITE_APP_API_URL, "/files/font");