import {FileTypeEnum, GuardTypeEnum, isTaskCancellable, isTaskFinished, PathCompletionEnum, TaskStatusEnum, TaskTypeEnum} from "../../models";

/** The models barrel re-exports the enums and the shared task helpers; every value export is reachable through it. */
describe("models barrel", () => {
    it("exposes the file service enums", () => {
        expect(FileTypeEnum.IMAGE).toBe("IMAGE");
        expect(GuardTypeEnum.CIRCLE).toBe("CIRCLE");
        expect(PathCompletionEnum.EXPORTED).toBe("EXPORTED");
        expect(TaskTypeEnum.METADATA_UPDATE_VALUE).toBe("METADATA_UPDATE_VALUE");
    });

    it("re-exports the task status model of the shared frontend package", () => {
        expect(TaskStatusEnum.COMPLETED).toBe("COMPLETED");
        expect(isTaskFinished(TaskStatusEnum.COMPLETED)).toBe(true);
        expect(isTaskFinished(TaskStatusEnum.RUNNING)).toBe(false);
        expect(isTaskCancellable(TaskStatusEnum.QUEUED)).toBe(true);
        expect(isTaskCancellable(TaskStatusEnum.FAILED)).toBe(false);
    });
});
