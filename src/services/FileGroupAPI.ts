import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {FileGroupRequest, FileGroupResponse} from "../models";

class FileGroupAPI extends AbstractAPI<FileGroupRequest, FileGroupResponse> {
}

export const fileGroupAPI = new FileGroupAPI(import.meta.env.VITE_APP_API_URL, "/file-groups");