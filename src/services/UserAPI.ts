import {UserAPI} from "@vempain/vempain-auth-frontend";
import {resolveApiUrl} from "./resolveApiUrl";

/** User accounts of the file backend: the file service keeps its own user base, separate from the admin backend */
export const userAPI = new UserAPI(resolveApiUrl(), "/content-management/users");
