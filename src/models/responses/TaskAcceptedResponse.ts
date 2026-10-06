import type {TaskStatusEnum} from "../TaskStatusEnum.ts";

/** Body of every 202 answer that starts a background task; mirrors TaskAcceptedResponse of the file backend. */
export interface TaskAcceptedResponse {
    task_id: string;
    type: string;
    title: string;
    status: TaskStatusEnum;
    total_steps: number;
}
