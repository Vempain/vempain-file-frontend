import type {PublishAclRequest} from "../models";

/** Name of the form list {@code PublishAclEditor} manages; the host form reads it back with {@link toPublishAclRequests}. */
export const PUBLISH_ACL_FIELD = "acls";

/** One row of the editor: a partially filled request entry (the shared AclRowsEditor writes user_id/unit_id and the four switches) */
export type PublishAclRow = Partial<PublishAclRequest>;

function optionalId(value: number | null | undefined): number | null {
    return typeof value === "number" ? value : null;
}

/**
 * Converts the rows of the editor into the request entries: rows without a user or a unit are dropped, missing switches count as
 * false. Returns null when nothing is granted, so that the request stays identical to a publish without additional grantees.
 */
export function toPublishAclRequests(rows: PublishAclRow[] | undefined | null): PublishAclRequest[] | null {
    const acls = (rows ?? [])
        .filter(row => typeof row?.user_id === "number" || typeof row?.unit_id === "number")
        .map(row => ({
            user_id: optionalId(row.user_id),
            unit_id: optionalId(row.unit_id),
            read_privilege: row.read_privilege ?? false,
            create_privilege: row.create_privilege ?? false,
            modify_privilege: row.modify_privilege ?? false,
            delete_privilege: row.delete_privilege ?? false
        }));
    return acls.length > 0 ? acls : null;
}
