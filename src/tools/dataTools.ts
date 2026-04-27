/**
 * Converts a file group path to a valid data set identifier.
 * The result is lowercase, contains only alphanumeric characters and underscores,
 * has no leading or trailing underscores, and falls back to "gps_time_series" for
 * empty or non-alphanumeric paths.
 */
export function fileGroupPathToIdentifier(path: string): string {
    return path
            .replace(/^\//, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
        || "gps_time_series";
}

/**
 * Builds a data set identifier from file group path and group name.
 * Path and group name are joined with a hyphen, and directory separators /
 * and \\ plus whitespace are converted to underscores.
 */
export function fileGroupDatasetToIdentifier(path: string, groupName?: string): string {
    const normalizedPath = path.trim();
    const normalizedGroupName = (groupName ?? "").trim();
    const rawIdentifier = normalizedGroupName !== ""
        ? `${normalizedPath}-${normalizedGroupName}`
        : normalizedPath;

    return rawIdentifier
            .toLowerCase()
            .replace(/[\\/\s]+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_+|_+$/g, "")
        || "gps_time_series";
}

