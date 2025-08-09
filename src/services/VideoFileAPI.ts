import type {VideoFileResponse} from '../models/responses';
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class VideoFileAPI extends AbstractAPI<VideoFileResponse, VideoFileResponse> {
}

export const videoFileAPI = new VideoFileAPI(import.meta.env.VITE_APP_API_URL, "/files/video");