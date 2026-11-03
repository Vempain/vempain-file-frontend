import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {dataAPI, publishAPI} from "../../../services";
import {PublishDataSetModal} from "../../../components/data/PublishDataSetModal";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (_key: string, options?: { defaultValue?: string; identifier?: string }) =>
                (options?.defaultValue ?? _key).replace("{{identifier}}", options?.identifier ?? "")
    })
}));

// The shared ACL editor of the auth library is the stand-in of src/testUtils/mockAclRowsEditor.tsx
jest.mock("@vempain/vempain-auth-frontend", () => jest.requireActual("../../../testUtils/mockAclRowsEditor"), {virtual: true});

jest.mock("../../../services", () => ({
    dataAPI: {getDataSetStatus: jest.fn()},
    publishAPI: {getPublishUsers: jest.fn(), getPublishUnits: jest.fn()}
}));

const getDataSetStatus = jest.mocked(dataAPI.getDataSetStatus);
const getPublishUsers = jest.mocked(publishAPI.getPublishUsers);
const getPublishUnits = jest.mocked(publishAPI.getPublishUnits);

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

function renderModal(onSubmit = jest.fn(), onCancel = jest.fn(), identifier = "gps_timeseries_trip") {
    render(<PublishDataSetModal open identifier={identifier} title="GPS time series data set" description="Generated from the images"
                                okText="Create GPS time series" submitting={false} onCancel={onCancel} onSubmit={onSubmit}/>);
    return {onSubmit, onCancel};
}

describe("PublishDataSetModal", () => {
    beforeEach(() => {
        getDataSetStatus.mockReset();
        getPublishUsers.mockReset();
        getPublishUnits.mockReset();
        getPublishUsers.mockResolvedValue([{id: 12, login_name: "arnold", name: "Arnold", nick: "Ahnold"}]);
        getPublishUnits.mockResolvedValue([{id: 3, name: "Editors", description: null}]);
    });

    it("shows the identifier, reports a new data set and submits an empty grantee list", async () => {
        getDataSetStatus.mockResolvedValue({identifier: "gps_timeseries_trip", published: false, acls: []});
        const {onSubmit} = renderModal();

        expect(screen.getByText("GPS time series data set")).toBeTruthy();
        expect(screen.getByText("Generated from the images")).toBeTruthy();
        expect(screen.getByText("gps_timeseries_trip")).toBeTruthy();
        await waitFor(() => expect(getDataSetStatus).toHaveBeenCalledWith("gps_timeseries_trip"));
        await waitFor(() => expect(screen.getByTestId("publish-status-new")).toBeTruthy());
        await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());

        fireEvent.click(screen.getByText("Create GPS time series"));

        // always a list: an empty one tells the admin backend to drop earlier grantees
        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([]));
    });

    it("prefills the grantees of an existing data set and submits the edited rows", async () => {
        getDataSetStatus.mockResolvedValue({
            identifier: "music_library",
            published: true,
            acls: [{user_id: null, unit_id: 3, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: true}]
        });
        const {onSubmit} = renderModal(jest.fn(), jest.fn(), "music_library");

        await waitFor(() => expect(screen.getByTestId("publish-status-published")).toBeTruthy());
        expect(screen.getByText("Data set music_library exists in Vempain Admin; this run replaces its content")).toBeTruthy();
        await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());

        // the prefilled row is sent back unchanged ...
        fireEvent.click(screen.getByText("Create GPS time series"));
        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([
            {user_id: null, unit_id: 3, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: true}
        ]));

        // ... and an edit (the stub replaces the rows with a grant to the first user) is what gets submitted
        fireEvent.click(screen.getByText("stub: grant first user"));
        fireEvent.click(screen.getByText("Create GPS time series"));
        await waitFor(() => expect(onSubmit).toHaveBeenLastCalledWith([
            {user_id: 12, unit_id: null, read_privilege: true, create_privilege: false, modify_privilege: true, delete_privilege: false}
        ]));
    });

    it("tolerates a failed status lookup and cancels through the host", async () => {
        getDataSetStatus.mockRejectedValue(new Error("down"));
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        const {onCancel} = renderModal();

        await waitFor(() => expect(screen.getByTestId("publish-status-failed")).toBeTruthy());
        fireEvent.click(screen.getByText("Cancel"));
        expect(onCancel).toHaveBeenCalledTimes(1);
        jest.restoreAllMocks();
    });
});
