import {ApiTokenAPI} from "@vempain/vempain-common-frontend";
import {resolveApiUrl} from "./resolveApiUrl";

export const apiTokenAPI = new ApiTokenAPI(resolveApiUrl(), "/api-tokens");
