import type {IconFileResponse} from "../models";
import {AbstractFileAPI} from "./AbstractFileAPI.ts";

class IconFileAPI extends AbstractFileAPI<IconFileResponse, IconFileResponse> {
}

export const iconFileAPI = new IconFileAPI(import.meta.env.VITE_APP_API_URL, "/files/icon");