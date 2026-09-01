import type {AclVO, UserVO} from "@vempain/vempain-auth-frontend";
import {AdminAPI} from "./AdminAPI";
import {resolveAdminApiUrl} from "./resolveAdminApiUrl";

export interface AdminUserRequest {
    id: number;
    private_user?: boolean;
    name?: string;
    nick?: string;
    login_name?: string;
    privacy_type?: string;
    email?: string;
    street?: string;
    pob?: string;
    birthday?: Date;
    description?: string;
    password?: string;
    acls?: AclVO[];
    locked?: boolean;
}

class AdminUserAPI extends AdminAPI<AdminUserRequest, UserVO> {
    public update(payload: AdminUserRequest): Promise<UserVO> {
        this.setAuthorizationHeader();
        return this.axiosInstance.put<UserVO>(`/${payload.id}`, payload).then(response => response.data);
    }
}

export const adminUserAPI = new AdminUserAPI(resolveAdminApiUrl(), "/content-management/users");
