import type {PathCompletionEnum} from "../PathCompletionEnum";

export interface PathCompletionRequest {
    path: string;
    type: PathCompletionEnum;
}