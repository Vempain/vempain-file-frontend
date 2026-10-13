import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {PublishGpsTimeSeries} from "../../../components/data/PublishGpsTimeSeries";
import {dataAPI, fileGroupAPI} from "../../../services";

const trackTask = jest.fn();

// A stable translation function: the screen memoizes its fetcher on `t`
const translate = (key: string) => key;
jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: translate})
}));

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask})
}));

jest.mock("../../../services", () => ({
    dataAPI: {publishGpsTimeSeries: jest.fn()},
    fileGroupAPI: {findPageable: jest.fn()}
}));

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn()})
});

if (typeof globalThis.MessageChannel === "undefined") {
    class StubMessageChannel {
        port1: { onmessage: ((event: { data: unknown }) => void) | null; postMessage: (data: unknown) => void };
        port2: { onmessage: ((event: { data: unknown }) => void) | null; postMessage: (data: unknown) => void };

        constructor() {
            this.port1 = {onmessage: null, postMessage: data => setTimeout(() => this.port2.onmessage?.({data}), 0)};
            this.port2 = {onmessage: null, postMessage: data => setTimeout(() => this.port1.onmessage?.({data}), 0)};
        }
    }

    Object.defineProperty(globalThis, "MessageChannel", {writable: true, value: StubMessageChannel});
}

const findPageable = jest.mocked(fileGroupAPI.findPageable);
const publishGpsTimeSeries = jest.mocked(dataAPI.publishGpsTimeSeries);

const summer = {id: 1, path: "/trips/2024", group_name: "Summer", description: "", file_count: 2, gallery_id: null};
const winter = {id: 2, path: "/trips/2025", group_name: "", description: "", file_count: 1, gallery_id: null};

function page(content: unknown[], pageNumber = 0, last = true) {
    return {content, page: pageNumber, size: 200, total_elements: content.length, total_pages: 1, first: pageNumber === 0, last, empty: content.length === 0};
}

const firstRequest = {page: 0, size: 200, sort_by: "path", direction: "ASC", search: undefined, case_sensitive: false};

async function openDropdown() {
    fireEvent.mouseDown(screen.getByRole("combobox"));
    await screen.findByText("/trips/2024 (Summer)");
}

describe("PublishGpsTimeSeries", () => {
    beforeEach(() => {
        findPageable.mockReset();
        publishGpsTimeSeries.mockReset();
        trackTask.mockReset();
        findPageable.mockResolvedValue(page([summer, winter]) as never);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "warning").mockImplementation(() => ({}) as never);
    });

    afterEach(() => jest.restoreAllMocks());

    it("loads the file groups, derives the identifier of the selected group and starts the publish task", async () => {
        const accepted = {task_id: "t-1", type: "PUBLISH_GPS_TIME_SERIES", title: "GPS", status: "QUEUED", total_steps: 3};
        publishGpsTimeSeries.mockResolvedValue(accepted as never);
        render(<PublishGpsTimeSeries/>);

        await waitFor(() => expect(findPageable).toHaveBeenCalledWith(firstRequest));
        const publish = screen.getByRole("button", {name: "PublishGpsTimeSeries.actions.publish"}) as HTMLButtonElement;
        await waitFor(() => expect(publish.disabled).toBe(true));

        await openDropdown();
        fireEvent.click(screen.getByText("/trips/2024 (Summer)"));
        await waitFor(() => expect(screen.getByText("trips_2024-summer")).toBeTruthy());
        expect(publish.disabled).toBe(false);

        fireEvent.click(publish);
        await waitFor(() => expect(publishGpsTimeSeries).toHaveBeenCalledWith(1, "trips_2024-summer"));
        expect(trackTask).toHaveBeenCalledWith(accepted);
        expect(message.success).toHaveBeenCalledWith("PublishGpsTimeSeries.messages.publishStarted");
    });

    it("reports a failed publish", async () => {
        publishGpsTimeSeries.mockRejectedValue(new Error("down"));
        render(<PublishGpsTimeSeries/>);
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(1));

        await openDropdown();
        fireEvent.click(screen.getByText("/trips/2025"));
        await waitFor(() => expect(screen.getByText("trips_2025")).toBeTruthy());
        fireEvent.click(screen.getByRole("button", {name: "PublishGpsTimeSeries.actions.publish"}));

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("PublishGpsTimeSeries.messages.publishError"));
        expect(trackTask).not.toHaveBeenCalled();
    });

    it("searches with a debounce and warns when the selected group disappears from the results", async () => {
        render(<PublishGpsTimeSeries/>);
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(1));
        await openDropdown();
        fireEvent.click(screen.getByText("/trips/2024 (Summer)"));
        await waitFor(() => expect(screen.getByText("trips_2024-summer")).toBeTruthy());

        // Only the last search within the debounce window is sent
        findPageable.mockResolvedValue(page([winter]) as never);
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "tri"}});
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "trips/2025"}});
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(2), {timeout: 2000});
        expect(findPageable).toHaveBeenLastCalledWith({...firstRequest, search: "trips/2025"});

        // The selected group is no longer listed, so there is no identifier to publish
        await waitFor(() => expect(screen.queryByText("trips_2024-summer")).toBeNull());
        fireEvent.click(screen.getByRole("button", {name: "PublishGpsTimeSeries.actions.publish"}));
        expect(message.warning).toHaveBeenCalledWith("PublishGpsTimeSeries.messages.selectWarning");
        expect(publishGpsTimeSeries).not.toHaveBeenCalled();
    });

    it("loads the next page when the dropdown is scrolled to its end and ignores stale responses", async () => {
        let resolveFirst: (value: unknown) => void = () => undefined;
        findPageable.mockReturnValueOnce(new Promise(resolve => {
            resolveFirst = resolve;
        }) as never);
        render(<PublishGpsTimeSeries/>);
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(1));

        // A search started while the first request is pending supersedes it; its late result is dropped
        findPageable.mockResolvedValueOnce(page([summer], 0, false) as never);
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "sum"}});
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(2), {timeout: 2000});
        await act(async () => resolveFirst(page([winter])));
        await screen.findByText("/trips/2024 (Summer)");
        expect(screen.queryByText("/trips/2025")).toBeNull();

        // Scrolling to the end of the (jsdom-sized) list appends the next page without duplicates
        findPageable.mockResolvedValueOnce(page([summer, winter], 1, true) as never);
        fireEvent.mouseDown(screen.getByRole("combobox"));
        const list = document.querySelector(".ant-select-dropdown-list-holder");
        expect(list).not.toBeNull();
        fireEvent.scroll(list!);
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(3));
        expect(findPageable).toHaveBeenLastCalledWith({...firstRequest, page: 1, search: "sum"});
        await screen.findByText("/trips/2025");
        expect(screen.getAllByText("/trips/2024 (Summer)")).toHaveLength(1);

        // The last page was reached, so further scrolling fetches nothing
        fireEvent.scroll(list!);
        expect(findPageable).toHaveBeenCalledTimes(3);
    });

    it("reports a failed group load and cancels a pending search on unmount", async () => {
        findPageable.mockRejectedValueOnce(new Error("down"));
        const {unmount} = render(<PublishGpsTimeSeries/>);

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("PublishGpsTimeSeries.messages.fetchGroupsError"));

        fireEvent.change(screen.getByRole("combobox"), {target: {value: "never sent"}});
        unmount();
        await new Promise(resolve => setTimeout(resolve, 300));
        expect(findPageable).toHaveBeenCalledTimes(1);
    });
});
