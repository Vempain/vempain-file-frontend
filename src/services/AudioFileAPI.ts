import type {AudioFileResponse} from "../models";
import {AbstractFileAPI} from "./AbstractFileAPI.ts";

class AudioFileAPI extends AbstractFileAPI<AudioFileResponse, AudioFileResponse> {
}

export const audioFileAPI = new AudioFileAPI(import.meta.env.VITE_APP_API_URL, "/files/audio");