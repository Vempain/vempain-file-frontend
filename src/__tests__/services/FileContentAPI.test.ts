import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {FileContentAPI} from "../../services";

describe("FileContentAPI", () => {
    let fileContentAPI: FileContentAPI;

    beforeEach(() => {
        resetServiceMockState();
        fileContentAPI = new FileContentAPI("http://localhost:8080/api", "/files");
    });

    it("is instantiated with /files member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith("http://localhost:8080/api", "/files");
    });

    it("getFileContent GETs /{id}/content as a Blob", async () => {
        const responseData = new Blob(["file content"], {type: "text/plain"});
        axiosMock.get.mockResolvedValueOnce({data: responseData});

        const response = await fileContentAPI.getFileContent(42);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("/42/content", {responseType: "blob"});
        expect(response).toBe(responseData);
    });
});
