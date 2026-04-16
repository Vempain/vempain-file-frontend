import type {PagedRequest, PagedResponse} from "@vempain/vempain-auth-frontend";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {ArchiveFileAPI, AudioFileAPI, DocumentFileAPI, FontFileAPI, IconFileAPI, ImageFileAPI, VectorFileAPI, VideoFileAPI} from "../../services";
import type {
    ArchiveFileResponse,
    AudioFileResponse,
    DocumentFileResponse,
    FontFileResponse,
    IconFileResponse,
    ImageFileResponse,
    VectorFileResponse,
    VideoFileResponse,
} from "../../models";

function createPagedResponse<T>(item: T): PagedResponse<T> {
    return {
        content: [item],
        page: 0,
        size: 10,
        total_elements: 1,
        total_pages: 1,
        first: true,
        last: true,
        empty: false,
    };
}

describe("file type API services", () => {
    const pagedRequest: PagedRequest = {page: 0, size: 10};
    let archiveFileAPI: ArchiveFileAPI;
    let audioFileAPI: AudioFileAPI;
    let documentFileAPI: DocumentFileAPI;
    let fontFileAPI: FontFileAPI;
    let iconFileAPI: IconFileAPI;
    let imageFileAPI: ImageFileAPI;
    let vectorFileAPI: VectorFileAPI;
    let videoFileAPI: VideoFileAPI;


    beforeEach(() => {
        resetServiceMockState();
        archiveFileAPI = new ArchiveFileAPI("http://localhost:8080/api", "/files/archive");
        audioFileAPI = new AudioFileAPI("http://localhost:8080/api", "/files/audio");
        documentFileAPI = new DocumentFileAPI("http://localhost:8080/api", "/files/document");
        fontFileAPI = new FontFileAPI("http://localhost:8080/api", "/files/font");
        iconFileAPI = new IconFileAPI("http://localhost:8080/api", "/files/icon");
        imageFileAPI = new ImageFileAPI("http://localhost:8080/api", "/files/image");
        vectorFileAPI = new VectorFileAPI("http://localhost:8080/api", "/files/vector");
        videoFileAPI = new VideoFileAPI("http://localhost:8080/api", "/files/video");
    });

    it("wires each API class to the expected backend member path", () => {
        expect(constructorSpy.mock.calls).toEqual(expect.arrayContaining([
            [expect.anything(), "/files/archive"],
            [expect.anything(), "/files/audio"],
            [expect.anything(), "/files/document"],
            [expect.anything(), "/files/font"],
            [expect.anything(), "/files/icon"],
            [expect.anything(), "/files/image"],
            [expect.anything(), "/files/vector"],
            [expect.anything(), "/files/video"],
        ]));
    });

    it("loads archive files via findAllPageable with ArchiveFileResponse", async () => {
        const responseData = createPagedResponse({id: 1, filename: "archive.zip"} as ArchiveFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await archiveFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads audio files via findAllPageable with AudioFileResponse", async () => {
        const responseData = createPagedResponse({id: 2, filename: "audio.mp3"} as AudioFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await audioFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads document files via findAllPageable with DocumentFileResponse", async () => {
        const responseData = createPagedResponse({id: 3, filename: "manual.pdf"} as DocumentFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await documentFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads font files via findAllPageable with FontFileResponse", async () => {
        const responseData = createPagedResponse({id: 4, filename: "font.ttf"} as FontFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await fontFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads icon files via findAllPageable with IconFileResponse", async () => {
        const responseData = createPagedResponse({id: 5, filename: "icon.svg"} as IconFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await iconFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads image files via findAllPageable with ImageFileResponse", async () => {
        const responseData = createPagedResponse({id: 6, filename: "image.jpg"} as ImageFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await imageFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads vector files via findAllPageable with VectorFileResponse", async () => {
        const responseData = createPagedResponse({id: 7, filename: "vector.ai"} as VectorFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await vectorFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads video files via findAllPageable with VideoFileResponse", async () => {
        const responseData = createPagedResponse({id: 8, filename: "video.mp4"} as VideoFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await videoFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });
});

