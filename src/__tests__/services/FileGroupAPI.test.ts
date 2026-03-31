import type {PagedRequest, PagedResponse} from "@vempain/vempain-auth-frontend";
import type {FileGroupListResponse, FileGroupResponse} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {FileGroupAPI} from "../../services";

describe("FileGroupAPI", () => {
    const fileGroupAPI = new FileGroupAPI("http://localhost:8080/api", "/file-groups");


    beforeEach(() => {
        resetServiceMockState();
    });

    it("is instantiated with /file-groups member path", () => {
        expect(constructorSpy.mock.calls).toEqual(expect.arrayContaining([
            [expect.anything(), "/file-groups"],
        ]));
    });

    it("findById GETs /{id} and returns FileGroupResponse", async () => {
        const responseData = {
            id: 1,
            path: "/files/group-1",
            group_name: "Group 1",
            description: "Test group",
            files: [],
        } as FileGroupResponse;
        axiosMock.get.mockResolvedValueOnce({data: responseData});

        const response = await fileGroupAPI.findById(1);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.get["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.get).toHaveBeenCalledWith("/1");
        expect(response).toEqual(responseData);
    });

    it("getFileGroups POSTs PagedRequest to /paged and returns PagedResponse<FileGroupListResponse>", async () => {
        const pagedRequest: PagedRequest = {
            page: 0,
            size: 50,
            sort_by: "path",
            direction: "ASC",
        };

        const responseData: PagedResponse<FileGroupListResponse> = {
            content: [{
                id: 1,
                path: "/files/group-1",
                group_name: "Group 1",
                description: "Test group",
                file_count: 0,
                gallery_id: null,
            }],
            page: 0,
            size: 50,
            total_elements: 1,
            total_pages: 1,
            first: true,
            last: true,
            empty: false,
        };
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await fileGroupAPI.getFileGroups(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/paged", pagedRequest);
        expect(response).toEqual(responseData);
    });
});

