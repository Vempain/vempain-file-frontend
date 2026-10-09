import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {publishAPI} from "../../../services";
import {PublishFileButton} from "../../../components/files/PublishFileButton";
import type {FileResponse} from "../../../models";

const trackTask = jest.fn();

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (_key: string, options?: { defaultValue?: string; filename?: string }) =>
                (options?.defaultValue ?? _key).replace("{{filename}}", options?.filename ?? "")
    })
}));

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask})
}));

jest.mock("../../../services", () => ({
    publishAPI: {
        publishFile: jest.fn(),
        getPublishUsers: jest.fn()
    }
}));

const publishFile = jest.mocked(publishAPI.publishFile);
const getPublishUsers = jest.mocked(publishAPI.getPublishUsers);

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
        trackTask.mockReset();
        getPublishUsers.mockResolvedValue([{id: 12, login_name: "arnold", name: "Arnold", nick: "Ahnold"}]);
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
        await waitFor(() => expect(screen.getByText("Add admin user")).toBeTruthy());

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
        await waitFor(() => expect(screen.getByText("Add admin user")).toBeTruthy());
        fireEvent.click(screen.getByText("Add admin user"));
        await waitFor(() => expect(screen.getAllByTestId("publish-acl-row")).toHaveLength(1));

        // A row without a user blocks the submit
        fireEvent.click(screen.getByText("OK"));
        await waitFor(() => expect(screen.getByText("Select a user")).toBeTruthy());
        expect(publishFile).not.toHaveBeenCalled();

        // Pick the user through the select and grant modify in addition to the default read
        fireEvent.mouseDown(screen.getByRole("combobox"));
        fireEvent.click(await screen.findByText("Arnold (arnold)"));
        fireEvent.click(screen.getAllByRole("switch")[2]);
        fireEvent.click(screen.getByText("OK"));

        await waitFor(() => expect(publishFile).toHaveBeenCalledWith({
            file_id: 55,
            acls: [{user_id: 12, read_privilege: true, create_privilege: false, modify_privilege: true, delete_privilege: false}]
        }));
    });

    it("reports a failed publish", async () => {
        publishFile.mockRejectedValue(new Error("boom"));
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        render(<PublishFileButton file={file}/>);

        fireEvent.click(screen.getByLabelText("Publish"));
        await waitFor(() => expect(screen.getByText("Add admin user")).toBeTruthy());
        fireEvent.click(screen.getByText("OK"));

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to publish file"));
        expect(trackTask).not.toHaveBeenCalled();
    });
});
