import type {ScanRequest, ScanResponses} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {FileScannerAPI} from "../../services";

describe("FileScannerAPI", () => {
    let fileScannerAPI: FileScannerAPI;

    beforeEach(() => {
        resetServiceMockState();
        fileScannerAPI = new FileScannerAPI("http://localhost:8080/api", "/scan-files");
    });

    it("is instantiated with /scan-files member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith(expect.anything(), "/scan-files");
    });

    it("scanDirectory POSTs request body to base endpoint and returns ScanResponses", async () => {
        const request: ScanRequest = {
            original_directory: "/source",
            exported_directory: "/export",
        };

        const responseData: ScanResponses = {
            scan_original_response: {
                success: true,
                error_message: null,
                scanned_files_count: 1,
                new_files_count: 1,
                successful_files: [],
                failed_files: [],
            },
            scan_export_response: {
                success: true,
                error_message: null,
                scanned_files_count: 1,
                new_files_count: 1,
                successful_files: [],
                failed_files: [],
            },
        };
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await fileScannerAPI.scanDirectory(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("", request);
        expect(response).toEqual(responseData);
    });
});

