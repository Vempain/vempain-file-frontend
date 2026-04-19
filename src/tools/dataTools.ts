/**
 * Converts a file group path to a valid data set identifier.
 *
 * Rules: lowercase, alphanumeric and underscores only, starts with letter (or digit),
 * no leading/trailing underscores. Falls back to "gps_time_series" for empty/invalid paths.
 */
export function fileGroupPathToIdentifier(path: string): string {
    return path
            .replace(/^\//, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
        || "gps_time_series";
}
