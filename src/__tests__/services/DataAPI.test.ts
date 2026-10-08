import type {TaskAcceptedResponse} from "../../models";
import {TaskStatusEnum} from "../../models";
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

    it("publishMusic POSTs /music with null body and returns the accepted task", async () => {
        const responseData: TaskAcceptedResponse = {
            task_id: "music-task",
            type: "PUBLISH_MUSIC_DATA",
            title: "Publish music data set",
            status: TaskStatusEnum.QUEUED,
            total_steps: 3,
        };
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await dataAPI.publishMusic();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.defaults.headers.post["Content-Type"]).toBe("application/json;charset=utf-8");
        expect(axiosMock.post).toHaveBeenCalledWith("/music", null);
        expect(response).toEqual(responseData);
    });

    it("publishGpsTimeSeries POSTs /gps-timeseries with filegroup ID and time series name and returns the accepted task", async () => {
        const responseData: TaskAcceptedResponse = {
            task_id: "gps-task",
            type: "PUBLISH_GPS_TIME_SERIES",
            title: "Publish GPS time series holidays_2024",
            status: TaskStatusEnum.QUEUED,
            total_steps: 3,
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
