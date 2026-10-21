/**
 * An admin-backend grantee that an earlier publish put on the ACL of the site file or gallery it created: the shape of PublishAclRequest,
 * so that the publish dialog can show the rows and send them back unchanged. The publishing service account is never listed.
 */
export interface PublishedAclResponse {
    user_id: number | null;
    unit_id: number | null;
    read_privilege: boolean;
    create_privilege: boolean;
    modify_privilege: boolean;
    delete_privilege: boolean;
}
