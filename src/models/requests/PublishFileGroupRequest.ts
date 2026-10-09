import type {PublishAclRequest} from "./PublishAclRequest";

export interface PublishFileGroupRequest {
    file_group_id: number;
    gallery_name?: string | null;
    gallery_description?: string | null;
    /** Additional admin users granted privileges on the published site files and gallery; the service account keeps every privilege */
    acls?: PublishAclRequest[] | null;
}
