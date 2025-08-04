export const PathCompletionEnum = {
    ORIGINAL: "ORIGINAL",
    EXPORTED: "EXPORTED"
} as const;

export type PathCompletionEnum = (typeof PathCompletionEnum)[keyof typeof PathCompletionEnum];