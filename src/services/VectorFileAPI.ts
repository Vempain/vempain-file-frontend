import type {VectorFileResponse} from '../models';
import {AbstractFileAPI} from "./AbstractFileAPI.ts";

class VectorFileAPI extends AbstractFileAPI<VectorFileResponse, VectorFileResponse> {
}

export const vectorFileAPI = new VectorFileAPI(import.meta.env.VITE_APP_API_URL, "/files/vector");