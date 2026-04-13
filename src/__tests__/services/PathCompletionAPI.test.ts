import {PathCompletionEnum, type PathCompletionRequest, type PathCompletionResponse} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {PathCompletionAPI} from "../../services";

describe("PathCompletionAPI", () => {
    let pathCompletionAPI: PathCompletionAPI;

    beforeEach(() => {
        resetServiceMockState();
        pathCompletionAPI = new PathCompletionAPI("http://localhost:8080/api", "/path-completion");
    });

    it("is instantiated with /path-completion member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith(expect.anything(), "/path-completion");
    });

    it("completePath POSTs request payload and returns PathCompletionResponse", async () => {
        const request: PathCompletionRequest = {
            path: "/three/gar",
            type: PathCompletionEnum.ORIGINAL,
        };
        const responseData: PathCompletionResponse = {
            completions: ["/three/garett", "/three/gartva", "/three/gartre"],
        };
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await pathCompletionAPI.completePath(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("", request);
        expect(response).toEqual(responseData);
    });
});

