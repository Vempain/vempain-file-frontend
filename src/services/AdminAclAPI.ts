import {AdminAPI} from "./AdminAPI";
import {resolveAdminApiUrl} from "./resolveAdminApiUrl";

export interface AdminAclResponse {
    acl_id: number;
    user: number | null;
    unit: number | null;
    create_privilege: boolean;
    read_privilege: boolean;
    modify_privilege: boolean;
    delete_privilege: boolean;
}

class AdminAclAPI extends AdminAPI<never, AdminAclResponse> {
    public getAll(): Promise<AdminAclResponse[]> {
        return this.findAll();
    }
}

export const adminAclAPI = new AdminAclAPI(resolveAdminApiUrl(), "/content-management/acls");
