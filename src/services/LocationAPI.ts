import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {LocationRequest, LocationResponse} from "../models";

export class LocationAPI extends AbstractAPI<LocationRequest, LocationResponse> {
}

export const locationAPI = new LocationAPI(import.meta.env.VITE_APP_API_URL, "/location");