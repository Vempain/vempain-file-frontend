/**
 * Background task types emitted by the file backend. The progress facility itself is type agnostic (the type is a string);
 * this list documents which result payload a finished task of each type carries.
 */
export const TaskTypeEnum = {
    /** One file published as a site file, no gallery */
    PUBLISH_FILE: 'PUBLISH_FILE' as const,
    PUBLISH_FILE_GROUP: 'PUBLISH_FILE_GROUP' as const,
    PUBLISH_ALL_FILE_GROUPS: 'PUBLISH_ALL_FILE_GROUPS' as const,
    /** Result: ScanResponses */
    SCAN_DIRECTORIES: 'SCAN_DIRECTORIES' as const,
    /** Result: DataResponse */
    PUBLISH_MUSIC_DATA: 'PUBLISH_MUSIC_DATA' as const,
    /** Result: DataResponse */
    PUBLISH_GPS_TIME_SERIES: 'PUBLISH_GPS_TIME_SERIES' as const,
    TAG_REMOVE_FROM_ALL: 'TAG_REMOVE_FROM_ALL' as const,
    TAG_REPLACE_ACROSS_ALL: 'TAG_REPLACE_ACROSS_ALL' as const,
    TAG_RENAME_ACROSS_ALL: 'TAG_RENAME_ACROSS_ALL' as const
};

export type TaskTypeEnum = typeof TaskTypeEnum[keyof typeof TaskTypeEnum];
