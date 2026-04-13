import type {TagRequest, TagResponse} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {TagsAPI} from "../../services";

describe("TagsAPI", () => {
    let tagsAPI: TagsAPI;

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
        tagsAPI = new TagsAPI("http://localhost:8080/api", "/tags");
    });

    it("is instantiated with /tags member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith(expect.anything(), "/tags");
    });

    it("findAll returns TagResponse[]", async () => {
        axiosMock.get.mockResolvedValueOnce({data: [tagResponse]});

        const response = await tagsAPI.findAll();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("", {params: undefined});
        expect(response).toEqual([tagResponse]);
    });

    it("create posts TagRequest and returns TagResponse", async () => {
        axiosMock.post.mockResolvedValueOnce({data: tagResponse});

        const response = await tagsAPI.create(tagRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("", tagRequest);
        expect(response).toEqual(tagResponse);
    });

    it("update puts TagRequest and returns TagResponse", async () => {
        axiosMock.put.mockResolvedValueOnce({data: tagResponse});

        const response = await tagsAPI.update(tagRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.put).toHaveBeenCalledWith("", tagRequest);
        expect(response).toEqual(tagResponse);
    });

    it("delete sends tag id and returns success flag", async () => {
        axiosMock.delete.mockResolvedValueOnce({data: true});

        const response = await tagsAPI.delete(10);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.delete).toHaveBeenCalledWith("/10");
        expect(response).toBe(true);
    });
});


