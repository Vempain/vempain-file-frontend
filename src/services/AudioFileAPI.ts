import type {AudioFileResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class AudioFileAPI extends AbstractAPI<AudioFileResponse, AudioFileResponse> {
}

export const audioFileAPI = new AudioFileAPI(import.meta.env.VITE_APP_API_URL, "/files/audio");