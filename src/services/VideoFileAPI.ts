import type {VideoFileResponse} from '../models';
import {AbstractFileAPI} from "./AbstractFileAPI.ts";

class VideoFileAPI extends AbstractFileAPI<VideoFileResponse, VideoFileResponse> {
}

export const videoFileAPI = new VideoFileAPI(import.meta.env.VITE_APP_API_URL, "/files/video");