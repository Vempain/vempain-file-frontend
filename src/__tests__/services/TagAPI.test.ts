import type {TagRequest, TagResponse} from "../../models";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {TagAPI} from "../../services";

describe("TagAPI", () => {
    let tagAPI: TagAPI;

    const tagRequest: TagRequest = {
        id: 10,
        tag_name: "news",
        tag_name_de: "nachrichten",
        tag_name_en: "news",
        tag_name_es: "noticias",
        tag_name_fi: "uutiset",
        tag_name_sv: "nyheter",
    };

    const tagResponse: TagResponse = {...tagRequest};

    beforeEach(() => {
        resetServiceMockState();
        tagAPI = new TagAPI("http://localhost:8080/api", "/tags");
    });

    it("is instantiated with /tags member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith(expect.anything(), "/tags");
    });

    it("findAll returns TagResponse[]", async () => {
        axiosMock.get.mockResolvedValueOnce({data: [tagResponse]});

        const response = await tagAPI.findAll();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("", {params: undefined});
        expect(response).toEqual([tagResponse]);
    });

    it("findPageable posts a paged request and returns PagedResponse", async () => {
        const pagedRequest: PagedRequest = {page: 0, size: 10, sort_by: "tag_name", direction: "ASC", search: "news"};
        const pagedResponse = {content: [tagResponse], page: 0, size: 10, total_elements: 1, total_pages: 1, first: true, last: true, empty: false};
        axiosMock.post.mockResolvedValueOnce({data: pagedResponse});

        const response = await tagAPI.findPageable(pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("paged", pagedRequest);
        expect(response).toEqual(pagedResponse);
    });

    it("create posts TagRequest and returns TagResponse", async () => {
        axiosMock.post.mockResolvedValueOnce({data: tagResponse});

        const response = await tagAPI.create(tagRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("", tagRequest);
        expect(response).toEqual(tagResponse);
    });

    it("update puts TagRequest and returns TagResponse", async () => {
        axiosMock.put.mockResolvedValueOnce({data: tagResponse});

        const response = await tagAPI.update(tagRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.put).toHaveBeenCalledWith("", tagRequest);
        expect(response).toEqual(tagResponse);
    });

    it("delete sends tag id and returns success flag", async () => {
        axiosMock.delete.mockResolvedValueOnce({data: true});

        const response = await tagAPI.delete(10);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.delete).toHaveBeenCalledWith("/10");
        expect(response).toBe(true);
    });

    it("findFilesPageable posts the tag id and paged request", async () => {
        const pagedRequest: PagedRequest = {page: 0, size: 10, sort_by: "filename", direction: "ASC"};
        const pagedResponse = {content: [], page: 0, size: 10, total_elements: 0, total_pages: 0, first: true, last: true, empty: true};
        axiosMock.post.mockResolvedValueOnce({data: pagedResponse});

        const response = await tagAPI.findFilesPageable(4, pagedRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("4/files/paged", pagedRequest);
        expect(response).toEqual(pagedResponse);
    });
});
