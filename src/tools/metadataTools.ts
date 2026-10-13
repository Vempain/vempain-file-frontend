import type {MetadataSummaryResponse} from "../models";

/** Row key of a metadata summary: the group, key and value identify the row (there is no id). */
export function metadataRowKey(row: MetadataSummaryResponse): string {
    return `${row.metadata_group}\u0000${row.metadata_key}\u0000${row.metadata_value}`;
}
