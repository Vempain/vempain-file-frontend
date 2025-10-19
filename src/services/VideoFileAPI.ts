import type {VideoFileResponse} from '../models';
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class VideoFileAPI extends AbstractAPI<VideoFileResponse, VideoFileResponse> {
}

export const videoFileAPI = new VideoFileAPI(import.meta.env.VITE_APP_API_URL, "/files/video");