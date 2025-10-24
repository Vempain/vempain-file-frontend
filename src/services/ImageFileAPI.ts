import type {ImageFileResponse} from "../models";
import {AbstractFileAPI} from "./AbstractFileAPI.ts";

class ImageFileAPI extends AbstractFileAPI<ImageFileResponse, ImageFileResponse> {
}

export const imageFileAPI = new ImageFileAPI(import.meta.env.VITE_APP_API_URL, "/files/image");