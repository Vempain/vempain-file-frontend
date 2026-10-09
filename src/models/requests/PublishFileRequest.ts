import type {PublishAclRequest} from "./PublishAclRequest";

/** Publishes one file as a site file of the admin backend; no gallery is created or linked */
export interface PublishFileRequest {
    file_id: number;
    acls?: PublishAclRequest[] | null;
}
