import {AbstractAPI} from "../../../vempain-frontend-auth/src/services/AbstractAPI.ts";
import type {VectorFileResponse} from '../models/responses';

class VectorFileAPI extends AbstractAPI<VectorFileResponse, VectorFileResponse> {
}

export const vectorFileAPI = new VectorFileAPI(import.meta.env.VITE_APP_API_URL, "/files/vector");