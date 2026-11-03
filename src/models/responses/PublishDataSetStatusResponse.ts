import type {PublishedAclResponse} from "./PublishedAclResponse";

/**
 * Whether the admin backend holds a data set with the identifier already (GET /data-publish/{identifier}/status) and who was granted
 * privileges on it; the rows have the shape of PublishAclRequest so the dialog can send them back, changed or not.
 */
export interface PublishDataSetStatusResponse {
    identifier: string;
    published: boolean;
    acls: PublishedAclResponse[];
}
