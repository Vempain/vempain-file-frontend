export const PublishProgressStatusEnum = {
    SCHEDULED: 'SCHEDULED' as const,
    STARTED: 'STARTED' as const,
    COMPLETED: 'COMPLETED' as const,
    FAILED: 'FAILED' as const
};

export type PublishProgressStatusEnum = typeof PublishProgressStatusEnum[keyof typeof PublishProgressStatusEnum];

