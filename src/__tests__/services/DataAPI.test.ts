import type {DataRequest, DataResponse, DataSummaryResponse} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {DataAPI} from "../../services";

describe("DataAPI", () => {
    let dataAPI: DataAPI;

    beforeEach(() => {
        resetServiceMockState();
        dataAPI = new DataAPI("http://localhost:8080/api", "/content-management/data");
    });

    it("is instantiated with /content-management/data member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith(expect.anything(), "/content-management/data");
    });

    it("getAllDataSets GETs '' and returns DataSummaryResponse[]", async () => {
        const responseData: DataSummaryResponse[] = [
            {
                id: 1,
                identifier: "music",
                type: "tabulated",
                description: "Music collection",
                column_definitions: "[{\"name\":\"title\",\"type\":\"string\"}]",
                create_sql: "CREATE TABLE website_data__music (id BIGSERIAL PRIMARY KEY, title VARCHAR(255))",
                fetch_all_sql: "SELECT * FROM website_data__music ORDER BY id",
                fetch_subset_sql: "SELECT * FROM website_data__music WHERE title = :title",
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-02T00:00:00Z",
            },
        ];
        axiosMock.get.mockResolvedValueOnce({data: responseData});

        const response = await dataAPI.getAllDataSets();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.get["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.get).toHaveBeenCalledWith("");
        expect(response).toEqual(responseData);
    });

    it("getDataSetByIdentifier GETs /{identifier} and returns DataResponse", async () => {
        const responseData: DataResponse = {
            id: 1,
            identifier: "music",
            type: "tabulated",
            description: "Music collection",
            column_definitions: "[{\"name\":\"title\",\"type\":\"string\"}]",
            create_sql: "CREATE TABLE website_data__music (id BIGSERIAL PRIMARY KEY, title VARCHAR(255))",
            fetch_all_sql: "SELECT * FROM website_data__music ORDER BY id",
            fetch_subset_sql: "SELECT * FROM website_data__music WHERE title = :title",
            csv_data: "title\nAbbey Road",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
        };
        axiosMock.get.mockResolvedValueOnce({data: responseData});

        const response = await dataAPI.getDataSetByIdentifier("music");

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.get["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.get).toHaveBeenCalledWith("/music");
        expect(response).toEqual(responseData);
    });

    it("createDataSet POSTs '' with DataRequest and returns DataResponse", async () => {
        const request: DataRequest = {
            identifier: "music",
            type: "tabulated",
            description: "Music collection",
            column_definitions: "[{\"name\":\"title\",\"type\":\"string\"}]",
            create_sql: "CREATE TABLE website_data__music (id BIGSERIAL PRIMARY KEY, title VARCHAR(255))",
            fetch_all_sql: "SELECT * FROM website_data__music ORDER BY id",
            fetch_subset_sql: "SELECT * FROM website_data__music WHERE title = :title",
            csv_data: "title\nAbbey Road",
        };
        const responseData: DataResponse = {
            id: 1,
            identifier: "music",
            type: "tabulated",
            description: "Music collection",
            column_definitions: "[{\"name\":\"title\",\"type\":\"string\"}]",
            create_sql: "CREATE TABLE website_data__music (id BIGSERIAL PRIMARY KEY, title VARCHAR(255))",
            fetch_all_sql: "SELECT * FROM website_data__music ORDER BY id",
            fetch_subset_sql: "SELECT * FROM website_data__music WHERE title = :title",
            csv_data: "title\nAbbey Road",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
        };
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await dataAPI.createDataSet(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("", request);
        expect(response).toEqual(responseData);
    });

    it("updateDataSet PUTs '' with DataRequest and returns DataResponse", async () => {
        const request: DataRequest = {
            identifier: "music",
            type: "tabulated",
            column_definitions: "[{\"name\":\"title\",\"type\":\"string\"}]",
            create_sql: "CREATE TABLE website_data__music (id BIGSERIAL PRIMARY KEY, title VARCHAR(255))",
            fetch_all_sql: "SELECT * FROM website_data__music ORDER BY id",
            fetch_subset_sql: "SELECT * FROM website_data__music WHERE title = :title",
            csv_data: "title\nOK Computer",
        };
        const responseData: DataResponse = {
            id: 1,
            identifier: "music",
            type: "tabulated",
            column_definitions: "[{\"name\":\"title\",\"type\":\"string\"}]",
            create_sql: "CREATE TABLE website_data__music (id BIGSERIAL PRIMARY KEY, title VARCHAR(255))",
            fetch_all_sql: "SELECT * FROM website_data__music ORDER BY id",
            fetch_subset_sql: "SELECT * FROM website_data__music WHERE title = :title",
            csv_data: "title\nOK Computer",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-03T00:00:00Z",
        };
        axiosMock.put.mockResolvedValueOnce({data: responseData});

        const response = await dataAPI.updateDataSet(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.put["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.put).toHaveBeenCalledWith("", request);
        expect(response).toEqual(responseData);
    });

    it("publishDataSet POSTs /{identifier}/publish with null body and returns DataResponse", async () => {
        const responseData: DataResponse = {
            id: 1,
            identifier: "music",
            type: "tabulated",
            column_definitions: "[{\"name\":\"title\",\"type\":\"string\"}]",
            create_sql: "CREATE TABLE website_data__music (id BIGSERIAL PRIMARY KEY, title VARCHAR(255))",
            fetch_all_sql: "SELECT * FROM website_data__music ORDER BY id",
            fetch_subset_sql: "SELECT * FROM website_data__music WHERE title = :title",
            csv_data: "title\nAbbey Road",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
        };
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await dataAPI.publishDataSet("music");

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/music/publish", null);
        expect(response).toEqual(responseData);
    });
});
