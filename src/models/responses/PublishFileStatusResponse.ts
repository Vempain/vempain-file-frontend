import type {PublishedAclResponse} from "./PublishedAclResponse";

/** Whether a file was published to the admin backend before (GET /publish/file/{id}/status) and who was granted privileges on its site file */
export interface PublishFileStatusResponse {
    file_id: number;
    published: boolean;
    site_file_id: number | null;
    acls: PublishedAclResponse[];
}
