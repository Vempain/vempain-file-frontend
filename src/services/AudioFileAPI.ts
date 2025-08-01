import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI.ts";
import type {AudioFileResponse} from "../models/responses";

class AudioFileAPI extends AbstractAPI<AudioFileResponse, AudioFileResponse> {
}

export const audioFileAPI = new AudioFileAPI(import.meta.env.VITE_APP_API_URL, "/files/audio");