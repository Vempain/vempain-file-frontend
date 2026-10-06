import type {PublishFileGroupRequest, TaskAcceptedResponse} from "../../models";
import {TaskStatusEnum} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {PublishAPI} from "../../services";

describe("PublishAPI", () => {
    let publishAPI: PublishAPI;

    const accepted: TaskAcceptedResponse = {
        task_id: "4f1c2d7e-9a0b-4c3d-8e2f-1a2b3c4d5e6f",
        type: "PUBLISH_FILE_GROUP",
        title: "Publish file group Gallery",
        status: TaskStatusEnum.QUEUED,
        total_steps: 0,
    };

    beforeEach(() => {
        resetServiceMockState();
        publishAPI = new PublishAPI("http://localhost:8080/api", "/publish");
    });

    it("is instantiated with /publish member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith(expect.anything(), "/publish");
    });

    it("publishFileGroup POSTs /file-group and returns the accepted task", async () => {
        const request: PublishFileGroupRequest = {
            file_group_id: 11,
            gallery_name: "Gallery",
            gallery_description: "Description",
        };
        axiosMock.post.mockResolvedValueOnce({data: accepted});

        const response = await publishAPI.publishFileGroup(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/file-group", request);
        expect(response).toEqual(accepted);
    });

    it("publishAllFileGroups GETs /all-file-groups and returns the accepted task", async () => {
        const allAccepted: TaskAcceptedResponse = {...accepted, type: "PUBLISH_ALL_FILE_GROUPS", title: "Publish all file groups", total_steps: 6};
        axiosMock.get.mockResolvedValueOnce({data: allAccepted});

        const response = await publishAPI.publishAllFileGroups();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.get["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.get).toHaveBeenCalledWith("/all-file-groups");
        expect(response).toEqual(allAccepted);
    });
});
