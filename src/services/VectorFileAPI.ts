import type {VectorFileResponse} from '../models';
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class VectorFileAPI extends AbstractAPI<VectorFileResponse, VectorFileResponse> {
}

export const vectorFileAPI = new VectorFileAPI(import.meta.env.VITE_APP_API_URL, "/files/vector");