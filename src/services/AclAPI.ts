import {AclAPI} from "@vempain/vempain-auth-frontend";
import {resolveApiUrl} from "./resolveApiUrl";

/** ACL rows of the file backend, for the permissions overview */
export const aclAPI = new AclAPI(resolveApiUrl(), "/content-management/acls");
