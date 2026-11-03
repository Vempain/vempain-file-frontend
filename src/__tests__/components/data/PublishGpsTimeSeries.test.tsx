import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {PublishGpsTimeSeries} from "../../../components/data/PublishGpsTimeSeries";
import {dataAPI, fileGroupAPI, publishAPI} from "../../../services";

const trackTask = jest.fn();

// A stable translation function: the screen memoizes its fetcher on `t`
const translate = (key: string) => key;
jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: translate})
}));

jest.mock("@vempain/vempain-common-frontend", () => ({
    // the split button stub of the manual mock, the task hook with this test's spy
    ...jest.requireActual<Record<string, unknown>>("../../../../__mocks__/@vempain/vempain-common-frontend"),
    useTaskProgress: () => ({trackTask})
}));

// The shared ACL editor of the auth library is the stand-in of src/testUtils/mockAclRowsEditor.tsx ("stub: grant first user" button)
jest.mock("@vempain/vempain-auth-frontend", () => jest.requireActual("../../../testUtils/mockAclRowsEditor"), {virtual: true});

jest.mock("../../../services", () => ({
    dataAPI: {publishGpsTimeSeries: jest.fn(), getDataSetStatus: jest.fn()},
    fileGroupAPI: {findPageable: jest.fn()},
    publishAPI: {getPublishUsers: jest.fn(), getPublishUnits: jest.fn()}
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
const getDataSetStatus = jest.mocked(dataAPI.getDataSetStatus);
const getPublishUsers = jest.mocked(publishAPI.getPublishUsers);
const getPublishUnits = jest.mocked(publishAPI.getPublishUnits);

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

/** The main part of the split button opens the dialog; the task starts when its OK button (labelled with the action) is clicked */
async function openDialog() {
    fireEvent.click(screen.getByTestId("gps-create-main"));
    await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());
}

describe("PublishGpsTimeSeries", () => {
    beforeEach(() => {
        findPageable.mockReset();
        publishGpsTimeSeries.mockReset();
        trackTask.mockReset();
        findPageable.mockResolvedValue(page([summer, winter]) as never);
        getDataSetStatus.mockReset();
        getPublishUsers.mockReset();
        getPublishUnits.mockReset();
        getDataSetStatus.mockResolvedValue({identifier: "trips_2024-summer", published: false, acls: []});
        getPublishUsers.mockResolvedValue([{id: 12, login_name: "arnold", name: "Arnold", nick: "Ahnold"}]);
        getPublishUnits.mockResolvedValue([]);
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
        const publish = screen.getByTestId("gps-create-main") as HTMLButtonElement;
        await waitFor(() => expect(publish.disabled).toBe(true));

        await openDropdown();
        fireEvent.click(screen.getByText("/trips/2024 (Summer)"));
        await waitFor(() => expect(screen.getByText("trips_2024-summer")).toBeTruthy());
        expect(publish.disabled).toBe(false);

        // the button opens the dialog, which asks the file backend whether the data set exists and starts the task with the granted rows
        await openDialog();
        expect(publishGpsTimeSeries).not.toHaveBeenCalled();
        await waitFor(() => expect(getDataSetStatus).toHaveBeenCalledWith("trips_2024-summer"));
        fireEvent.click(screen.getByText("stub: grant first user"));
        fireEvent.click(screen.getAllByText("PublishGpsTimeSeries.actions.create")[1]);
        await waitFor(() => expect(publishGpsTimeSeries).toHaveBeenCalledWith(1, "trips_2024-summer", false, [
            {user_id: 12, unit_id: null, read_privilege: true, create_privilege: false, modify_privilege: true, delete_privilege: false}
        ]));
        expect(trackTask).toHaveBeenCalledWith(accepted);
        await waitFor(() => expect(screen.queryByTestId("acl-rows-editor")).toBeNull());

        // "Create and publish" sends the website publishing flag; without rows the grantee list is empty
        fireEvent.click(screen.getByTestId("gps-create-option-create-and-publish"));
        expect(screen.getByTestId("gps-create-main").textContent).toBe("PublishGpsTimeSeries.actions.createAndPublish");
        await openDialog();
        fireEvent.click(screen.getAllByText("PublishGpsTimeSeries.actions.createAndPublish")[1]);
        await waitFor(() => expect(publishGpsTimeSeries).toHaveBeenLastCalledWith(1, "trips_2024-summer", true, []));
        expect(message.success).toHaveBeenCalledWith("PublishGpsTimeSeries.messages.publishStarted");
    });

    it("reports a failed publish", async () => {
        publishGpsTimeSeries.mockRejectedValue(new Error("down"));
        render(<PublishGpsTimeSeries/>);
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(1));

        await openDropdown();
        fireEvent.click(screen.getByText("/trips/2025"));
        await waitFor(() => expect(screen.getByText("trips_2025")).toBeTruthy());
        await openDialog();
        fireEvent.click(screen.getAllByText("PublishGpsTimeSeries.actions.create")[1]);

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("PublishGpsTimeSeries.messages.publishError"));
        expect(trackTask).not.toHaveBeenCalled();
        // the dialog stays open after a failure
        expect(screen.getByTestId("acl-rows-editor")).toBeTruthy();
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

        // The selected group is no longer listed, so there is no identifier to publish and no dialog opens
        await waitFor(() => expect(screen.queryByText("trips_2024-summer")).toBeNull());
        fireEvent.click(screen.getByTestId("gps-create-main"));
        expect(message.warning).toHaveBeenCalledWith("PublishGpsTimeSeries.messages.selectWarning");
        expect(screen.queryByTestId("acl-rows-editor")).toBeNull();
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
