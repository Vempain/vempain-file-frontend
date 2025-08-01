import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI.ts";
import type {ImageFileResponse} from "../models/responses";

class ImageFileAPI extends AbstractAPI<ImageFileResponse, ImageFileResponse> {
}

export const imageFileAPI = new ImageFileAPI(import.meta.env.VITE_APP_API_URL, "/files/image");