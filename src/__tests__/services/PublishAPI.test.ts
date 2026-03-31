import {
    type PublishAllFileGroupsResponse,
    type PublishFileGroupRequest,
    type PublishFileGroupResponse,
    type PublishProgressResponse,
    PublishProgressStatusEnum
} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {PublishAPI} from "../../services";

describe("PublishAPI", () => {
    const publishAPI = new PublishAPI("http://localhost:8080/api", "/publish");


    beforeEach(() => {
        resetServiceMockState();
    });

    it("is instantiated with /publish member path", () => {
        expect(constructorSpy.mock.calls).toEqual(expect.arrayContaining([
            [expect.anything(), "/publish"],
        ]));
    });

    it("publishFileGroup POSTs /file-group and returns PublishFileGroupResponse[]", async () => {
        const request: PublishFileGroupRequest = {
            file_group_id: 11,
            gallery_name: "Gallery",
            gallery_description: "Description",
        };
        const responseData: PublishFileGroupResponse[] = [{files_to_publish_count: 4}];
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await publishAPI.publishFileGroup(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/file-group", request);
        expect(response).toEqual(responseData);
    });

    it("publishAllFileGroups GETs /all-file-groups", async () => {
        const responseData: PublishAllFileGroupsResponse = {file_group_count: 6};
        axiosMock.get.mockResolvedValueOnce({data: responseData});

        const response = await publishAPI.publishAllFileGroups();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.get["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.get).toHaveBeenCalledWith("/all-file-groups");
        expect(response).toEqual(responseData);
    });

    it("getPublishProgress GETs /progress", async () => {
        const responseData: PublishProgressResponse = {
            total_groups: 6,
            scheduled: 0,
            started: 0,
            completed: 6,
            failed: 0,
            per_group_status: {
                "11": PublishProgressStatusEnum.COMPLETED,
            },
            last_updated: "2026-03-31T22:00:00Z",
        };
        axiosMock.get.mockResolvedValueOnce({data: responseData});

        const response = await publishAPI.getPublishProgress();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.get["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.get).toHaveBeenCalledWith("/progress");
        expect(response).toEqual(responseData);
    });
});

