import {axiosMock} from "../../../testUtils/mockAuthFrontend";
import {render, screen, waitFor} from "@testing-library/react";
import {Statistics} from "../../../components/management/Statistics";
import {statisticsAPI} from "../../../services";

jest.mock("@ant-design/charts", () => ({
    Column: () => <div data-testid="type-chart"/>,
    Line: () => <div data-testid="year-chart"/>,
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
    }),
}));

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    }),
});

describe("Statistics", () => {
    it("loads and displays the statistics sections", async () => {
        jest.spyOn(statisticsAPI, "getStatistics").mockResolvedValue({
            total_files: 3,
            files_by_type: {image: 3},
            files_by_type_and_year: {image: {"2024": 3}},
            total_tags: 2,
            total_gps_locations: 1,
            files_with_gps_locations: 1,
            files_with_tags: 2,
            largest_file_group_size: 3,
            smallest_file_group_size: 1,
            average_file_group_size: 2,
            total_file_size: 4096,
            largest_file_size: 2048,
            average_file_size: 1365,
            largest_file_size_by_type: {image: 2048},
            average_file_size_by_type: {image: 1365},
        });

        render(<Statistics/>);

        await waitFor(() => expect(screen.getByText("Overview")).toBeTruthy());
        expect(screen.getByText("Overview")).toBeTruthy();
        expect(screen.getByText("Files by type")).toBeTruthy();
        expect(screen.getByText("Files by type and creation year")).toBeTruthy();
        expect(screen.getByText("Metadata and groups")).toBeTruthy();
        expect(screen.getByTestId("type-chart")).toBeTruthy();
        expect(screen.getByTestId("year-chart")).toBeTruthy();
        expect(axiosMock.get).not.toHaveBeenCalled();
    });
});
