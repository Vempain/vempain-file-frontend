/**
 * An additional admin-backend user (from GET /publish/users) that is granted privileges on the site files and gallery a publish creates.
 * The admin and file user bases are separate: user_id is an admin account ID, never a file-side one.
 */
export interface PublishAclRequest {
    user_id: number;
    read_privilege: boolean;
    create_privilege: boolean;
    modify_privilege: boolean;
    delete_privilege: boolean;
}
