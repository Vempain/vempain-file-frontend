// services/TagsAPI.ts
import type {TagResponse} from "../models/responses";
import type {TagRequest} from "../models/requests";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class TagsAPI extends AbstractAPI<TagRequest, TagResponse> {
}

export const tagsAPI = new TagsAPI(import.meta.env.VITE_APP_API_URL, "/tags");