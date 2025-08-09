import type {ImageFileResponse} from "../models/responses";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class ImageFileAPI extends AbstractAPI<ImageFileResponse, ImageFileResponse> {
}

export const imageFileAPI = new ImageFileAPI(import.meta.env.VITE_APP_API_URL, "/files/image");