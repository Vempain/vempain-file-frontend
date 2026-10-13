import type {MetadataFilesRequest, MetadataSearchRequest, MetadataSummaryResponse, MetadataValueUpdateRequest} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {MetadataAPI} from "../../services";

describe("MetadataAPI", () => {
    let metadataAPI: MetadataAPI;

    const summary: MetadataSummaryResponse = {
        metadata_group: "XMP-dc",
        metadata_key: "Creator",
        metadata_value: "Jane Doe",
        file_count: 3,
        writable: true
    };

    beforeEach(() => {
        resetServiceMockState();
        metadataAPI = new MetadataAPI("http://localhost:8080/api", "/metadata");
    });

    it("is instantiated with the /metadata member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith(expect.anything(), "/metadata");
    });

    it("findSummaries posts the search request to paged and returns the page", async () => {
        const request: MetadataSearchRequest = {page: 0, size: 10, sort_by: "metadata_key", direction: "ASC", metadata_key: "creator", metadata_value: "jane"};
        const page = {content: [summary], page: 0, size: 10, total_elements: 1, total_pages: 1, first: true, last: true, empty: false};
        axiosMock.post.mockResolvedValueOnce({data: page});

        const response = await metadataAPI.findSummaries(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", request);
        expect(response).toEqual(page);
    });

    it("findFiles posts the selector and filters to files/paged", async () => {
        const request: MetadataFilesRequest = {
            metadata_group: "XMP-dc",
            metadata_key: "Creator",
            metadata_value: "Jane Doe",
            page: 1,
            size: 10,
            sort_by: "filesize",
            direction: "DESC",
            filename: "holiday",
            file_type: "IMAGE"
        };
        const page = {
            content: [{id: 5, filename: "holiday.jpg"}],
            page: 1,
            size: 10,
            total_elements: 11,
            total_pages: 2,
            first: false,
            last: true,
            empty: false
        };
        axiosMock.post.mockResolvedValueOnce({data: page});

        const response = await metadataAPI.findFiles(request);

        expect(axiosMock.post).toHaveBeenCalledWith("files/paged", request);
        expect(response).toEqual(page);
    });

    it("updateValue posts to value and returns the accepted task", async () => {
        const request: MetadataValueUpdateRequest = {metadata_group: "XMP-dc", metadata_key: "Creator", metadata_value: "Jane Doe", new_value: ""};
        const accepted = {task_id: "t-1", type: "METADATA_UPDATE_VALUE", title: "Remove XMP-dc:Creator in 3 files", status: "QUEUED", total_steps: 3};
        axiosMock.post.mockResolvedValueOnce({data: accepted});

        const response = await metadataAPI.updateValue(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("value", request);
        expect(response).toEqual(accepted);
    });
});
