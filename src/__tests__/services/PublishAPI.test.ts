import type {PublishAllFileGroupsRequest, PublishFileGroupRequest, PublishFileRequest, PublishUserResponse, TaskAcceptedResponse} from "../../models";
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

    it("publishFile POSTs /file with the ACL grantees and returns the accepted task", async () => {
        const request: PublishFileRequest = {
            file_id: 55,
            acls: [{user_id: 12, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: false}],
        };
        const single: TaskAcceptedResponse = {...accepted, type: "PUBLISH_FILE", title: "Publish file doc.pdf", total_steps: 1};
        axiosMock.post.mockResolvedValueOnce({data: single});

        const response = await publishAPI.publishFile(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/file", request);
        expect(response).toEqual(single);
    });

    it("publishFileGroup POSTs /file-group with the ACL grantees and returns the accepted task", async () => {
        const request: PublishFileGroupRequest = {
            file_group_id: 11,
            gallery_name: "Gallery",
            gallery_description: "Description",
            acls: [{user_id: 12, read_privilege: true, create_privilege: false, modify_privilege: true, delete_privilege: false}],
        };
        axiosMock.post.mockResolvedValueOnce({data: accepted});

        const response = await publishAPI.publishFileGroup(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/file-group", request);
        expect(response).toEqual(accepted);
    });

    it("publishAllFileGroups POSTs /all-file-groups with an empty body by default", async () => {
        const allAccepted: TaskAcceptedResponse = {...accepted, type: "PUBLISH_ALL_FILE_GROUPS", title: "Publish all file groups", total_steps: 6};
        axiosMock.post.mockResolvedValueOnce({data: allAccepted});

        const response = await publishAPI.publishAllFileGroups();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/all-file-groups", {});
        expect(response).toEqual(allAccepted);
    });

    it("publishAllFileGroups forwards the ACL grantees", async () => {
        const request: PublishAllFileGroupsRequest = {
            acls: [{user_id: 12, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: false}],
        };
        axiosMock.post.mockResolvedValueOnce({data: accepted});

        await publishAPI.publishAllFileGroups(request);

        expect(axiosMock.post).toHaveBeenCalledWith("/all-file-groups", request);
    });

    it("getPublishUsers GETs /users and returns the admin users", async () => {
        const users: PublishUserResponse[] = [{id: 12, login_name: "arnold", name: "Arnold", nick: "Ahnold"}];
        axiosMock.get.mockResolvedValueOnce({data: users});

        const response = await publishAPI.getPublishUsers();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("/users");
        expect(response).toEqual(users);
    });
});
