import type {PagedRequest, PagedResponse} from "@vempain/vempain-auth-frontend";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {
    ArchiveFileAPI,
    AudioFileAPI,
    BinaryFileAPI,
    DataFileAPI,
    DocumentFileAPI,
    ExecutableFileAPI,
    FontFileAPI,
    IconFileAPI,
    ImageFileAPI,
    InteractiveFileAPI,
    MusicFileAPI,
    ThumbFileAPI,
    VectorFileAPI,
    VideoFileAPI
} from "../../services";
import type {
    ArchiveFileResponse,
    AudioFileResponse,
    BinaryFileResponse,
    DataFileResponse,
    DocumentFileResponse,
    ExecutableFileResponse,
    FontFileResponse,
    IconFileResponse,
    ImageFileResponse,
    InteractiveFileResponse,
    MusicFileResponse,
    ThumbFileResponse,
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
    let binaryFileAPI: BinaryFileAPI;
    let dataFileAPI: DataFileAPI;
    let documentFileAPI: DocumentFileAPI;
    let executableFileAPI: ExecutableFileAPI;
    let fontFileAPI: FontFileAPI;
    let iconFileAPI: IconFileAPI;
    let imageFileAPI: ImageFileAPI;
    let interactiveFileAPI: InteractiveFileAPI;
    let musicFileAPI: MusicFileAPI;
    let thumbFileAPI: ThumbFileAPI;
    let vectorFileAPI: VectorFileAPI;
    let videoFileAPI: VideoFileAPI;


    beforeEach(() => {
        resetServiceMockState();
        archiveFileAPI = new ArchiveFileAPI("http://localhost:8080/api", "/files/archive");
        audioFileAPI = new AudioFileAPI("http://localhost:8080/api", "/files/audio");
        binaryFileAPI = new BinaryFileAPI("http://localhost:8080/api", "/files/binary");
        dataFileAPI = new DataFileAPI("http://localhost:8080/api", "/files/data");
        documentFileAPI = new DocumentFileAPI("http://localhost:8080/api", "/files/document");
        executableFileAPI = new ExecutableFileAPI("http://localhost:8080/api", "/files/executable");
        fontFileAPI = new FontFileAPI("http://localhost:8080/api", "/files/font");
        iconFileAPI = new IconFileAPI("http://localhost:8080/api", "/files/icon");
        imageFileAPI = new ImageFileAPI("http://localhost:8080/api", "/files/image");
        interactiveFileAPI = new InteractiveFileAPI("http://localhost:8080/api", "/files/interactive");
        musicFileAPI = new MusicFileAPI("http://localhost:8080/api", "/files/music");
        thumbFileAPI = new ThumbFileAPI("http://localhost:8080/api", "/files/thumb");
        vectorFileAPI = new VectorFileAPI("http://localhost:8080/api", "/files/vector");
        videoFileAPI = new VideoFileAPI("http://localhost:8080/api", "/files/video");
    });

    it("wires each API class to the expected backend member path", () => {
        expect(constructorSpy.mock.calls).toEqual(expect.arrayContaining([
            [expect.anything(), "/files/archive"],
            [expect.anything(), "/files/audio"],
            [expect.anything(), "/files/binary"],
            [expect.anything(), "/files/data"],
            [expect.anything(), "/files/document"],
            [expect.anything(), "/files/executable"],
            [expect.anything(), "/files/font"],
            [expect.anything(), "/files/icon"],
            [expect.anything(), "/files/image"],
            [expect.anything(), "/files/interactive"],
            [expect.anything(), "/files/music"],
            [expect.anything(), "/files/thumb"],
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

    it("loads binary files via findAllPageable with BinaryFileResponse", async () => {
        const responseData = createPagedResponse({id: 9, filename: "archive.bin"} as BinaryFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await binaryFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads data files via findAllPageable with DataFileResponse", async () => {
        const responseData = createPagedResponse({id: 10, filename: "dataset.json"} as DataFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await dataFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads executable files via findAllPageable with ExecutableFileResponse", async () => {
        const responseData = createPagedResponse({id: 11, filename: "setup.exe"} as ExecutableFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await executableFileAPI.findAllPageable(pagedRequest);

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

    it("loads interactive files via findAllPageable with InteractiveFileResponse", async () => {
        const responseData = createPagedResponse({id: 12, filename: "banner.swf"} as InteractiveFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await interactiveFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads music files via findAllPageable with MusicFileResponse", async () => {
        const responseData = createPagedResponse({id: 13, filename: "track.flac"} as MusicFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await musicFileAPI.findAllPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(responseData);
    });

    it("loads thumb files via findAllPageable with ThumbFileResponse", async () => {
        const responseData = createPagedResponse({id: 14, filename: "preview.png"} as ThumbFileResponse);
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await thumbFileAPI.findAllPageable(pagedRequest);

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

