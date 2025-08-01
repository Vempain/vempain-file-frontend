import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI.ts";
import type {IconFileResponse} from "../models/responses";

class IconFileAPI extends AbstractAPI<IconFileResponse, IconFileResponse> {
}

export const iconFileAPI = new IconFileAPI(import.meta.env.VITE_APP_API_URL, "/files/icon");