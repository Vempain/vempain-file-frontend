import type {AclVO, UnitVO} from "@vempain/vempain-auth-frontend";
import {AdminAPI} from "./AdminAPI";
import {resolveAdminApiUrl} from "./resolveAdminApiUrl";

export interface AdminUnitRequest {
    id: number;
    name?: string;
    description?: string;
    acls?: AclVO[];
    locked?: boolean;
}

class AdminUnitAPI extends AdminAPI<AdminUnitRequest, UnitVO> {
    public update(payload: AdminUnitRequest): Promise<UnitVO> {
        this.setAuthorizationHeader();
        return this.axiosInstance.put<UnitVO>(`/${payload.id}`, payload).then(response => response.data);
    }
}

export const adminUnitAPI = new AdminUnitAPI(resolveAdminApiUrl(), "/content-management/units");
