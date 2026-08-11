import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {StatisticsAPI} from "../../services";
import type {FileStatisticsResponse} from "../../models";

describe("StatisticsAPI", () => {
    let statisticsAPI: StatisticsAPI;

    beforeEach(() => {
        resetServiceMockState();
        statisticsAPI = new StatisticsAPI("http://localhost:8080/api", "/statistics");
    });

    it("is instantiated with the statistics member path", () => {
        expect(constructorSpy).toHaveBeenCalledWith(expect.anything(), "/statistics");
    });

    it("gets the file statistics response", async () => {
        const response: FileStatisticsResponse = {
            total_files: 1,
            files_by_type: {image: 1},
            files_by_type_and_year: {image: {"2024": 1}},
            total_tags: 2,
            total_gps_locations: 3,
            files_with_gps_locations: 1,
            files_with_tags: 1,
            largest_file_group_size: 1,
            smallest_file_group_size: 1,
            average_file_group_size: 1,
            total_file_size: 100,
            largest_file_size: 100,
            average_file_size: 100,
            largest_file_size_by_type: {image: 100},
            average_file_size_by_type: {image: 100},
        };
        axiosMock.get.mockResolvedValueOnce({data: response});

        await expect(statisticsAPI.getStatistics()).resolves.toEqual(response);
        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("");
    });
});
