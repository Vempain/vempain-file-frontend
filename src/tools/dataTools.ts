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
