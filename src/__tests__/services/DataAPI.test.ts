import type {DataResponse} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {DataAPI} from "../../services";

describe("DataAPI", () => {
    let dataAPI: DataAPI;

    beforeEach(() => {
        resetServiceMockState();
        dataAPI = new DataAPI("http://localhost:8080/api", "/data-publish");
    });

    it("is instantiated with /data-publish member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith(expect.anything(), "/data-publish");
    });

    it("publishMusic POSTs /music with null body and returns DataResponse", async () => {
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
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await dataAPI.publishMusic();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/music", null);
        expect(response).toEqual(responseData);
    });

    it("publishGpsTimeSeries POSTs /gps-timeseries with filegroup ID and time series name and returns DataResponse", async () => {
        const responseData: DataResponse = {
            id: 2,
            identifier: "holidays_2024",
            type: "gps-timeseries",
            column_definitions: "[]",
            create_sql: "",
            fetch_all_sql: "",
            fetch_subset_sql: "",
            csv_data: "",
            created_at: "2024-06-01T00:00:00Z",
            updated_at: "2024-06-02T00:00:00Z",
        };
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await dataAPI.publishGpsTimeSeries(42, "holidays_2024");

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/gps-timeseries", {
            file_group_id: 42,
            time_series_name: "holidays_2024",
        });
        expect(response).toEqual(responseData);
    });
});
