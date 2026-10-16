/**
 * An additional admin-backend grantee, a user from GET /publish/users or a unit from GET /publish/units, that is granted privileges on
 * the site files and gallery a publish creates. Exactly one of user_id and unit_id is set. The admin and file user bases are separate:
 * the IDs are admin-side IDs, never file-side ones.
 */
export interface PublishAclRequest {
    user_id: number | null;
    unit_id: number | null;
    read_privilege: boolean;
    create_privilege: boolean;
    modify_privilege: boolean;
    delete_privilege: boolean;
}
