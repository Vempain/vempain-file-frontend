import {UnitAPI} from "@vempain/vempain-auth-frontend";
import {resolveApiUrl} from "./resolveApiUrl";

/** Units (user groups) of the file backend's own user base */
export const unitAPI = new UnitAPI(resolveApiUrl(), "/content-management/units");
