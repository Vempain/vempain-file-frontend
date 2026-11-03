import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {PublishMusicData} from "../../../components/data/PublishMusicData";
import {dataAPI, publishAPI} from "../../../services";

const trackTask = jest.fn();

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string) => key})
}));

jest.mock("@vempain/vempain-common-frontend", () => ({
    // the split button stub of the manual mock, the task hook with this test's spy
    ...jest.requireActual<Record<string, unknown>>("../../../../__mocks__/@vempain/vempain-common-frontend"),
    useTaskProgress: () => ({trackTask})
}));

// The shared ACL editor of the auth library is the stand-in of src/testUtils/mockAclRowsEditor.tsx ("stub: grant first user" button)
jest.mock("@vempain/vempain-auth-frontend", () => jest.requireActual("../../../testUtils/mockAclRowsEditor"), {virtual: true});

jest.mock("../../../services", () => ({
    dataAPI: {publishMusic: jest.fn(), getDataSetStatus: jest.fn()},
    publishAPI: {getPublishUsers: jest.fn(), getPublishUnits: jest.fn()}
}));

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn()})
});

// antd's Form field scheduler needs MessageChannel, which jsdom lacks
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

const publishMusic = jest.mocked(dataAPI.publishMusic);
const getDataSetStatus = jest.mocked(dataAPI.getDataSetStatus);
const getPublishUsers = jest.mocked(publishAPI.getPublishUsers);
const getPublishUnits = jest.mocked(publishAPI.getPublishUnits);

/** Opens the dialog through the main part of the split button and waits for the ACL editor */
async function openDialog() {
    fireEvent.click(screen.getByTestId("music-create-main"));
    await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());
}

describe("PublishMusicData", () => {
    beforeEach(() => {
        publishMusic.mockReset();
        getDataSetStatus.mockReset();
        getPublishUsers.mockReset();
        getPublishUnits.mockReset();
        trackTask.mockReset();
        getDataSetStatus.mockResolvedValue({identifier: "music_library", published: false, acls: []});
        getPublishUsers.mockResolvedValue([{id: 12, login_name: "arnold", name: "Arnold", nick: "Ahnold"}]);
        getPublishUnits.mockResolvedValue([{id: 3, name: "Editors", description: null}]);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
    });

    afterEach(() => jest.restoreAllMocks());

    it("opens the dialog, asks whether the data set exists and starts the task with the granted rows", async () => {
        const accepted = {task_id: "t-1", type: "PUBLISH_MUSIC_DATA", title: "Publish music", status: "QUEUED", total_steps: 3};
        publishMusic.mockResolvedValue(accepted as never);
        render(<PublishMusicData/>);

        expect(screen.getByTestId("music-create-main").textContent).toBe("PublishMusicData.actions.create");
        // nothing starts before the dialog is confirmed
        await openDialog();
        expect(publishMusic).not.toHaveBeenCalled();
        await waitFor(() => expect(getDataSetStatus).toHaveBeenCalledWith("music_library"));
        await waitFor(() => expect(screen.getByTestId("publish-status-new")).toBeTruthy());
        expect(screen.getByText("music_library")).toBeTruthy();

        // The shared editor (stubbed here) writes one row granting the first user read and modify
        fireEvent.click(screen.getByText("stub: grant first user"));
        fireEvent.click(screen.getAllByText("PublishMusicData.actions.create")[1]);

        await waitFor(() => expect(trackTask).toHaveBeenCalledWith(accepted));
        // the plain action only creates the data set in the admin backend, with the granted row
        expect(publishMusic).toHaveBeenCalledWith(false, [
            {user_id: 12, unit_id: null, read_privilege: true, create_privilege: false, modify_privilege: true, delete_privilege: false}
        ]);
        expect(message.success).toHaveBeenCalledWith("PublishMusicData.messages.publishStarted");
        expect(screen.getByText("PublishMusicData.header.title")).toBeTruthy();
    });

    it("creates and publishes the data set when that action is picked, sending an empty grantee list without rows", async () => {
        const accepted = {task_id: "t-2", type: "PUBLISH_MUSIC_DATA", title: "Publish music", status: "QUEUED", total_steps: 4};
        publishMusic.mockResolvedValue(accepted as never);
        render(<PublishMusicData/>);

        // picking the action only changes the label, nothing starts
        fireEvent.click(screen.getByTestId("music-create-option-create-and-publish"));
        expect(screen.getByTestId("music-create-main").textContent).toBe("PublishMusicData.actions.createAndPublish");
        expect(publishMusic).not.toHaveBeenCalled();

        await openDialog();
        // the OK button of the dialog carries the picked action
        fireEvent.click(screen.getAllByText("PublishMusicData.actions.createAndPublish")[1]);

        await waitFor(() => expect(publishMusic).toHaveBeenCalledWith(true, []));
        expect(trackTask).toHaveBeenCalledWith(accepted);
    });

    it("prefills the grantees of an existing data set and sends them back", async () => {
        getDataSetStatus.mockResolvedValue({
            identifier: "music_library",
            published: true,
            acls: [{user_id: null, unit_id: 3, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: true}]
        });
        publishMusic.mockResolvedValue({task_id: "t-3", type: "PUBLISH_MUSIC_DATA", title: "x", status: "QUEUED", total_steps: 3} as never);
        render(<PublishMusicData/>);

        await openDialog();
        await waitFor(() => expect(screen.getByTestId("publish-status-published")).toBeTruthy());
        fireEvent.click(screen.getAllByText("PublishMusicData.actions.create")[1]);

        await waitFor(() => expect(publishMusic).toHaveBeenCalledWith(false, [
            {user_id: null, unit_id: 3, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: true}
        ]));
    });

    it("reports a failed start and keeps the dialog open", async () => {
        publishMusic.mockRejectedValue(new Error("down"));
        render(<PublishMusicData/>);

        await openDialog();
        fireEvent.click(screen.getAllByText("PublishMusicData.actions.create")[1]);

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("PublishMusicData.messages.publishError"));
        expect(trackTask).not.toHaveBeenCalled();
        expect(screen.getByTestId("acl-rows-editor")).toBeTruthy();
    });
});
