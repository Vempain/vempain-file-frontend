/**
 * A data set of the admin backend as POST /data-publish/paged lists it (DataSetSummaryResponse of the file backend): identity, type,
 * description, the timestamps and the admin-side audit trail (ISO strings). The sets are ACL-bearing in the admin backend; acl_id names the ACL.
 */
export interface DataSummaryResponse {
    id: number;
    acl_id: number;
    identifier: string;
    type: string;
    description: string | null;
    generated: string | null;
    creator: number;
    created: string;
    modifier: number | null;
    modified: string | null;
    /** When the data set was last released to the website, null when never */
    published: string | null;
}
