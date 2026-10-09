import type {PublishAclRequest} from "../models";

/** Name of the form list {@code PublishAclEditor} manages; the host form reads it back with {@link toPublishAclRequests}. */
export const PUBLISH_ACL_FIELD = "acls";

export const PUBLISH_PRIVILEGES = ["read_privilege", "create_privilege", "modify_privilege", "delete_privilege"] as const;
export type PublishPrivilege = typeof PUBLISH_PRIVILEGES[number];

/** One row of the editor: a partially filled request entry */
export type PublishAclRow = Omit<Partial<PublishAclRequest>, "user_id"> & { user_id?: number | null };

/**
 * Converts the rows of the editor into the request entries: rows without a user are dropped, missing switches count as false.
 * Returns null when nothing is granted, so that the request stays identical to a publish without additional users.
 */
export function toPublishAclRequests(rows: PublishAclRow[] | undefined | null): PublishAclRequest[] | null {
    const acls = (rows ?? [])
        .filter((row): row is PublishAclRow & { user_id: number } => typeof row?.user_id === "number")
        .map(row => ({
            user_id: row.user_id,
            read_privilege: row.read_privilege ?? false,
            create_privilege: row.create_privilege ?? false,
            modify_privilege: row.modify_privilege ?? false,
            delete_privilege: row.delete_privilege ?? false
        }));
    return acls.length > 0 ? acls : null;
}
