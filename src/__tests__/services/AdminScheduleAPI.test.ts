import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {adminScheduleAPI} from "../../services/AdminScheduleAPI";

// The singleton is created when the module loads, so its constructor call is captured before the first reset
const constructionCalls = constructorSpy.mock.calls.map(call => [...call]);

/** The schedule screens are the only ones that reach the admin backend; the singleton is bound to its /schedule-management path. */
describe("AdminScheduleAPI", () => {
    beforeEach(() => resetServiceMockState());

    it("is instantiated on the admin backend URL with the /schedule-management member path", () => {
        // jest.setup.ts provides the file backend URL on localhost:8080; resolveAdminApiUrl maps it to the admin port 9999
        expect(constructionCalls).toContainEqual(["http://localhost:9999/api", "/schedule-management"]);
        expect(adminScheduleAPI).toBeDefined();
    });

    it("getSystemSchedules GETs /system-schedules", async () => {
        const schedules = [{id: 1, schedule_name: "Nightly", status: "IDLE"}];
        axiosMock.get.mockResolvedValueOnce({data: schedules});

        await expect(adminScheduleAPI.getSystemSchedules()).resolves.toEqual(schedules);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("/system-schedules");
    });

    it("triggerSystemSchedule POSTs the schedule name and delay to /system-schedules", async () => {
        const triggered = {id: 1, schedule_name: "Nightly", status: "RUNNING"};
        axiosMock.post.mockResolvedValueOnce({data: triggered});

        await expect(adminScheduleAPI.triggerSystemSchedule({schedule_name: "Nightly", delay: 5})).resolves.toEqual(triggered);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("/system-schedules", {schedule_name: "Nightly", delay: 5});
    });

    it("getPublishingSchedules GETs /publishing", async () => {
        const schedules = [{id: 2, publish_time: "2024-01-01T00:00:00Z", publish_status: "READY", publish_message: "m", publish_type: "ALL", publish_id: 3}];
        axiosMock.get.mockResolvedValueOnce({data: schedules});

        await expect(adminScheduleAPI.getPublishingSchedules()).resolves.toEqual(schedules);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("/publishing");
    });

    it("triggerPublishingSchedule POSTs the schedule to /publishing", async () => {
        const schedule = {id: 2, publish_time: "2024-01-01T00:00:00Z", publish_status: "READY", publish_message: "m", publish_type: "ALL", publish_id: 3};
        axiosMock.post.mockResolvedValueOnce({data: {...schedule, publish_status: "DONE"}});

        await expect(adminScheduleAPI.triggerPublishingSchedule(schedule)).resolves.toEqual({...schedule, publish_status: "DONE"});

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("/publishing", schedule);
    });

    it("getFileImportSchedules GETs /file-imports", async () => {
        const schedules = [{id: 4, source_directory: "/in", destination_directory: "/out", generate_gallery: true, generate_page: false}];
        axiosMock.get.mockResolvedValueOnce({data: schedules});

        await expect(adminScheduleAPI.getFileImportSchedules()).resolves.toEqual(schedules);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("/file-imports");
    });
});
