import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {publishAPI} from "../../../services";
import {PublishFileButton} from "../../../components/files/PublishFileButton";
import type {FileResponse} from "../../../models";

const trackTask = jest.fn();

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (_key: string, options?: { defaultValue?: string; filename?: string; siteFileId?: number | string }) =>
                (options?.defaultValue ?? _key).replace("{{filename}}", options?.filename ?? "")
                        .replace("{{siteFileId}}", String(options?.siteFileId ?? ""))
    })
}));

jest.mock("@vempain/vempain-common-frontend", () => ({
    ...jest.requireActual("../../../../__mocks__/@vempain/vempain-common-frontend"),
    useTaskProgress: () => ({trackTask})
}));

// The shared ACL editor of the auth library is the stand-in of src/testUtils/mockAclRowsEditor.tsx ("stub: grant first user" button)
jest.mock("@vempain/vempain-auth-frontend", () => jest.requireActual("../../../testUtils/mockAclRowsEditor"), {virtual: true});

jest.mock("../../../services", () => ({
    publishAPI: {
        publishFile: jest.fn(),
        getPublishUsers: jest.fn(),
        getPublishUnits: jest.fn(),
        getFileStatus: jest.fn()
    }
}));

const publishFile = jest.mocked(publishAPI.publishFile);
const getPublishUsers = jest.mocked(publishAPI.getPublishUsers);
const getPublishUnits = jest.mocked(publishAPI.getPublishUnits);
const getFileStatus = jest.mocked(publishAPI.getFileStatus);

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })
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

const file = {id: 55, filename: "doc.pdf"} as FileResponse;

describe("PublishFileButton", () => {
    beforeEach(() => {
        publishFile.mockReset();
        getPublishUsers.mockReset();
        getPublishUnits.mockReset();
        getFileStatus.mockReset();
        trackTask.mockReset();
        getPublishUsers.mockResolvedValue([{id: 12, login_name: "arnold", name: "Arnold", nick: "Ahnold"}]);
        getPublishUnits.mockResolvedValue([{id: 3, name: "Editors", description: null}]);
        getFileStatus.mockResolvedValue({file_id: 55, published: false, site_file_id: null, acls: []});
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
    });

    it("opens the modal, publishes the file without ACLs and tracks the task", async () => {
        const accepted = {task_id: "t-1", type: "PUBLISH_FILE", title: "Publish file doc.pdf", status: "QUEUED", total_steps: 1};
        publishFile.mockResolvedValue(accepted as never);
        const onPublished = jest.fn();
        render(<PublishFileButton file={file} onPublished={onPublished}/>);

        fireEvent.click(screen.getByLabelText("Publish"));
        await waitFor(() => expect(screen.getByText("doc.pdf is published to Vempain Admin as a single site file; no gallery is created.")).toBeTruthy());
        await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());
        // The file backend was asked whether the file was published before; it was not
        await waitFor(() => expect(getFileStatus).toHaveBeenCalledWith(55));
        await waitFor(() => expect(screen.getByTestId("publish-status-new")).toBeTruthy());
        expect(screen.getByText("Not published to Vempain Admin before")).toBeTruthy();

        fireEvent.click(screen.getByText("OK"));

        await waitFor(() => expect(publishFile).toHaveBeenCalledWith({file_id: 55, acls: null}));
        expect(trackTask).toHaveBeenCalledWith(accepted, expect.objectContaining({onFinished: expect.any(Function)}));
        trackTask.mock.calls[0][1].onFinished();
        expect(onPublished).toHaveBeenCalledTimes(1);
        expect(message.success).toHaveBeenCalledWith("Publishing of doc.pdf started, follow the progress in the lower right corner");
    });

    it("sends the granted admin users with the request", async () => {
        publishFile.mockResolvedValue({task_id: "t-2", type: "PUBLISH_FILE", title: "x", status: "QUEUED", total_steps: 1} as never);
        render(<PublishFileButton file={file}/>);

        fireEvent.click(screen.getByLabelText("Publish"));
        await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());
        // The shared editor (stubbed here, tested in vempain-auth-frontend) writes one row granting the first user read and modify
        fireEvent.click(screen.getByText("stub: grant first user"));
        fireEvent.click(screen.getByText("OK"));

        await waitFor(() => expect(publishFile).toHaveBeenCalledWith({
            file_id: 55,
            acls: [{user_id: 12, unit_id: null, read_privilege: true, create_privilege: false, modify_privilege: true, delete_privilege: false}]
        }));
    });

    it("reports a failed publish", async () => {
        publishFile.mockRejectedValue(new Error("boom"));
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        render(<PublishFileButton file={file}/>);

        fireEvent.click(screen.getByLabelText("Publish"));
        await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());
        fireEvent.click(screen.getByText("OK"));

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to publish file"));
        expect(trackTask).not.toHaveBeenCalled();
    });

    it("prefills the grantees of the previous publish and sends them again", async () => {
        getFileStatus.mockResolvedValue({
            file_id: 55,
            published: true,
            site_file_id: 500,
            acls: [{user_id: null, unit_id: 3, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: true}]
        });
        publishFile.mockResolvedValue({task_id: "t-3", type: "PUBLISH_FILE", title: "x", status: "QUEUED", total_steps: 1} as never);
        render(<PublishFileButton file={file}/>);

        fireEvent.click(screen.getByLabelText("Publish"));
        await waitFor(() => expect(screen.getByTestId("publish-status-published")).toBeTruthy());
        expect(screen.getByText("Published before as site file #500")).toBeTruthy();
        expect(screen.getByText("The admin users and units granted access by the previous publish are prefilled below; publishing again keeps the same site files.")).toBeTruthy();
        await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());

        // Nothing is touched in the editor: the prefilled row of the previous publish is what gets sent
        fireEvent.click(screen.getByText("OK"));

        await waitFor(() => expect(publishFile).toHaveBeenCalledWith({
            file_id: 55,
            acls: [{user_id: null, unit_id: 3, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: true}]
        }));
    });

    it("still publishes when the publication status cannot be loaded", async () => {
        getFileStatus.mockRejectedValue(new Error("admin down"));
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        publishFile.mockResolvedValue({task_id: "t-4", type: "PUBLISH_FILE", title: "x", status: "QUEUED", total_steps: 1} as never);
        render(<PublishFileButton file={file}/>);

        fireEvent.click(screen.getByLabelText("Publish"));
        await waitFor(() => expect(screen.getByTestId("publish-status-failed")).toBeTruthy());
        expect(screen.getByText("Could not check whether this was published before; the permissions start empty")).toBeTruthy();
        await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());
        fireEvent.click(screen.getByText("OK"));

        await waitFor(() => expect(publishFile).toHaveBeenCalledWith({file_id: 55, acls: null}));
    });

    it("shows the status lookup in progress and reloads it every time the modal opens", async () => {
        let resolveStatus: (status: never) => void = () => undefined;
        getFileStatus.mockImplementation(() => new Promise(resolve => {
            resolveStatus = resolve as never;
        }));
        render(<PublishFileButton file={file}/>);

        fireEvent.click(screen.getByLabelText("Publish"));
        await waitFor(() => expect(screen.getByTestId("publish-status-loading")).toBeTruthy());
        // Closing while the lookup is still running discards its answer
        fireEvent.click(screen.getByText("Cancel"));
        resolveStatus({file_id: 55, published: true, site_file_id: 7, acls: []} as never);
        await waitFor(() => expect(screen.queryByTestId("publish-status-loading")).toBeNull());
        expect(screen.queryByTestId("publish-status-published")).toBeNull();

        getFileStatus.mockResolvedValue({file_id: 55, published: false, site_file_id: null, acls: []});
        fireEvent.click(screen.getByLabelText("Publish"));
        await waitFor(() => expect(getFileStatus).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.getByTestId("publish-status-new")).toBeTruthy());
    });
});
