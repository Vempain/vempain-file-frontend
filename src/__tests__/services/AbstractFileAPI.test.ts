import type {PagedRequest, PagedResponse} from "@vempain/vempain-auth-frontend";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {AbstractFileAPI} from "../../services";

interface TestRequest {
    id: number;
}

interface TestResponse {
    id: number;
    name: string;
}

describe("AbstractFileAPI", () => {
    beforeEach(() => {
        resetServiceMockState();
    });

    it("posts PagedRequest to relative paged endpoint and returns typed PagedResponse", async () => {

        class TestFileAPI extends AbstractFileAPI<TestRequest, TestResponse> {
        }

        const api = new TestFileAPI("http://localhost:8080/api", "/files/test");

        const pagedRequest: PagedRequest = {
            page: 0,
            size: 25,
            sort_by: "filename",
            direction: "ASC",
            search: "sample",
            case_sensitive: false,
        };

        const responseData: PagedResponse<TestResponse> = {
            content: [{id: 1, name: "test-file"}],
            page: 0,
            size: 25,
            total_elements: 1,
            total_pages: 1,
            first: true,
            last: true,
            empty: false,
        };

        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await api.findAllPageable(pagedRequest);

        expect(constructorSpy).toHaveBeenCalledWith("http://localhost:8080/api", "/files/test");
        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect((axiosMock.post.mock.calls[0]?.[0] as string).startsWith("/")).toBe(false);
        expect(response).toEqual(responseData);
    });
});

