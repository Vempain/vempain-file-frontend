import type {ImageFileResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class ImageFileAPI extends AbstractAPI<ImageFileResponse, ImageFileResponse> {
}

export const imageFileAPI = new ImageFileAPI(import.meta.env.VITE_APP_API_URL, "/files/image");