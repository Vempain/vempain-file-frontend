import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI.ts";
import type {VideoFileResponse} from '../models/responses';

class VideoFileAPI extends AbstractAPI<VideoFileResponse, VideoFileResponse> {
}

export const videoFileAPI = new VideoFileAPI(import.meta.env.VITE_APP_API_URL, "/files/video");