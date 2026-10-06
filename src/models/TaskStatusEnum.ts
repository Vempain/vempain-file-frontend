export const TaskStatusEnum = {
    QUEUED: 'QUEUED' as const,
    RUNNING: 'RUNNING' as const,
    COMPLETED: 'COMPLETED' as const,
    FAILED: 'FAILED' as const
};

export type TaskStatusEnum = typeof TaskStatusEnum[keyof typeof TaskStatusEnum];

export function isTaskFinished(status: TaskStatusEnum): boolean {
    return status === TaskStatusEnum.COMPLETED || status === TaskStatusEnum.FAILED;
}
