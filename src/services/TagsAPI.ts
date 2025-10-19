// services/TagsAPI.ts
import type {TagRequest, TagResponse} from "../models";
import {AbstractAPI} from "@vempain/vempain-auth-frontend";

class TagsAPI extends AbstractAPI<TagRequest, TagResponse> {
}

export const tagsAPI = new TagsAPI(import.meta.env.VITE_APP_API_URL, "/tags");