import type {PublishedAclResponse} from "./PublishedAclResponse";

/** Whether a file group was published to the admin backend before (GET /publish/file-group/{id}/status), as which gallery, and its grantees */
export interface PublishFileGroupStatusResponse {
    file_group_id: number;
    published: boolean;
    gallery_id: number | null;
    gallery_name: string | null;
    site_file_ids: number[];
    acls: PublishedAclResponse[];
}
