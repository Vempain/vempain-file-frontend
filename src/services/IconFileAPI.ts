import type {IconFileResponse} from "../models/responses";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class IconFileAPI extends AbstractAPI<IconFileResponse, IconFileResponse> {
}

export const iconFileAPI = new IconFileAPI(import.meta.env.VITE_APP_API_URL, "/files/icon");