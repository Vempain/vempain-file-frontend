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

    it("publishMusic POSTs /music with the publish flag and returns the accepted task", async () => {
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
        // without the flag the data set is only created in the admin backend; without a grantee list the current grantees stay
        expect(axiosMock.post).toHaveBeenCalledWith("/music", {publish_to_site: false, acls: null});
        expect(response).toEqual(responseData);

        // "Create and publish" asks for the website publishing as well, and the dialog's rows travel as acls
        const acls = [{user_id: 12, unit_id: null, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: false}];
        axiosMock.post.mockResolvedValueOnce({data: responseData});
        await dataAPI.publishMusic(true, acls);
        expect(axiosMock.post).toHaveBeenLastCalledWith("/music", {publish_to_site: true, acls});
    });

    it("findPageableDataSets POSTs /paged with the paged request and returns the page", async () => {
        const page = {content: [{identifier: "music_library"}], page: 0, size: 25, total_elements: 1, total_pages: 1, first: true, last: true, empty: false};
        axiosMock.post.mockResolvedValueOnce({data: page});
        const request = {page: 0, size: 25, sort_by: "identifier", direction: "ASC" as const, modified_after_publish: true};

        const response = await dataAPI.findPageableDataSets(request);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("/paged", request);
        expect(response).toEqual(page);
    });

    it("getDataSetStatus GETs /{identifier}/status", async () => {
        const status = {identifier: "music_library", published: true, acls: []};
        axiosMock.get.mockResolvedValueOnce({data: status});

        const response = await dataAPI.getDataSetStatus("music_library");

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("/music_library/status");
        expect(response).toEqual(status);
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
            publish_to_site: false,
            acls: null,
        });
        expect(response).toEqual(responseData);

        axiosMock.post.mockResolvedValueOnce({data: responseData});
        await dataAPI.publishGpsTimeSeries(42, "holidays_2024", true, []);
        expect(axiosMock.post).toHaveBeenLastCalledWith("/gps-timeseries", {
            file_group_id: 42,
            time_series_name: "holidays_2024",
            publish_to_site: true,
            acls: [],
        });
    });
});

describe("DataAPI response interceptor", () => {
    type Handler = { fulfilled: (response: unknown) => unknown; rejected: (error: unknown) => Promise<never> };

    afterEach(() => {
        delete (axiosMock as unknown as { interceptors?: unknown }).interceptors;
    });

    it("ejects the inherited response interceptors and installs a pass-through one", async () => {
        resetServiceMockState();
        const handlers: Handler[] = [];
        const eject = jest.fn();
        const use = jest.fn((fulfilled: Handler["fulfilled"], rejected: Handler["rejected"]) => handlers.push({fulfilled, rejected}));
        (axiosMock as unknown as { interceptors: unknown }).interceptors = {
            response: {handlers: [{}, {}], eject, use}
        };

        new DataAPI("http://localhost:8080/api", "/data-publish");

        // Both pre-existing handlers (the session-terminating ones of the shared client) are removed by index
        expect(eject).toHaveBeenCalledTimes(2);
        expect(eject).toHaveBeenNthCalledWith(1, 0);
        expect(eject).toHaveBeenNthCalledWith(2, 1);
        expect(use).toHaveBeenCalledTimes(1);
        const [installed] = handlers;
        expect(installed.fulfilled({status: 403})).toEqual({status: 403});
        const error = new Error("forbidden");
        await expect(installed.rejected(error)).rejects.toBe(error);
    });

    it("installs the pass-through interceptor when the manager has no handler list", () => {
        resetServiceMockState();
        const use = jest.fn();
        (axiosMock as unknown as { interceptors: unknown }).interceptors = {response: {use}};

        new DataAPI("http://localhost:8080/api", "/data-publish");

        expect(use).toHaveBeenCalledTimes(1);
    });

    it("tolerates an interceptor manager that throws", () => {
        resetServiceMockState();
        (axiosMock as unknown as { interceptors: unknown }).interceptors = {
            response: {
                handlers: [{}],
                eject: () => {
                    throw new Error("not supported");
                },
                use: jest.fn()
            }
        };

        expect(() => new DataAPI("http://localhost:8080/api", "/data-publish")).not.toThrow();
    });
});
