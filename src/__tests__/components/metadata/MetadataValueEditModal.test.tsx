import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {Form, message} from "antd";
import {MetadataValueEditModal} from "../../../components/metadata/MetadataValueEditModal";
import {metadataAPI} from "../../../services";
import type {MetadataSummaryResponse} from "../../../models";

const trackTask = jest.fn();

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
            const text = (options?.defaultValue as string | undefined) ?? key;
            return text.replace(/\{\{(\w+)}}/g, (_match, name: string) => String(options?.[name] ?? ""));
        }
    })
}));

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask})
}));

jest.mock("../../../services", () => ({
    metadataAPI: {updateValue: jest.fn()}
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

const updateValue = jest.mocked(metadataAPI.updateValue);
const summary: MetadataSummaryResponse = {metadata_group: "XMP-dc", metadata_key: "Creator", metadata_value: "Jane", file_count: 3, writable: true};
const accepted = {task_id: "t-1", type: "METADATA_UPDATE_VALUE", title: "Rewrite", status: "QUEUED", total_steps: 3};

describe("MetadataValueEditModal", () => {
    beforeEach(() => {
        updateValue.mockReset();
        trackTask.mockReset();
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it("stays closed without a row", () => {
        render(<MetadataValueEditModal summary={null} onClose={jest.fn()}/>);
        expect(screen.queryByText("Edit metadata value")).toBeNull();
    });

    it("closes without saving on cancel", async () => {
        const onClose = jest.fn();
        render(<MetadataValueEditModal summary={summary} onClose={onClose}/>);

        await waitFor(() => expect((screen.getByLabelText("New value") as HTMLTextAreaElement).value).toBe("Jane"));
        expect(screen.getByText("The new value is written into all 3 files carrying this value. Leave it empty to remove the entry from the files.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", {name: "Cancel"}));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(updateValue).not.toHaveBeenCalled();
    });

    it("removes the entry with an empty value, tracks the task and reloads through onFinished", async () => {
        updateValue.mockResolvedValue(accepted as never);
        const onClose = jest.fn();
        const onFinished = jest.fn();
        render(<MetadataValueEditModal summary={summary} onClose={onClose} onFinished={onFinished}/>);
        await waitFor(() => expect((screen.getByLabelText("New value") as HTMLTextAreaElement).value).toBe("Jane"));

        fireEvent.change(screen.getByLabelText("New value"), {target: {value: ""}});
        fireEvent.click(screen.getByRole("button", {name: "Save"}));

        await waitFor(() => expect(updateValue).toHaveBeenCalledWith({
            metadata_group: "XMP-dc",
            metadata_key: "Creator",
            metadata_value: "Jane",
            new_value: ""
        }));
        expect(trackTask).toHaveBeenCalledWith(accepted, expect.objectContaining({onFinished: expect.any(Function)}));
        expect(message.success).toHaveBeenCalledWith("Rewriting XMP-dc:Creator in 3 files started, follow the progress in the lower right corner");
        expect(onClose).toHaveBeenCalledTimes(1);
        trackTask.mock.calls[0][1].onFinished();
        expect(onFinished).toHaveBeenCalledTimes(1);
    });

    it("works without an onFinished callback and reports a rewrite that could not be started", async () => {
        updateValue.mockResolvedValueOnce(accepted as never).mockRejectedValueOnce(new Error("down"));
        const onClose = jest.fn();
        const {rerender} = render(<MetadataValueEditModal summary={summary} onClose={onClose}/>);
        await waitFor(() => expect((screen.getByLabelText("New value") as HTMLTextAreaElement).value).toBe("Jane"));

        fireEvent.click(screen.getByRole("button", {name: "Save"}));
        await waitFor(() => expect(trackTask).toHaveBeenCalledTimes(1));
        expect(() => trackTask.mock.calls[0][1].onFinished()).not.toThrow();

        rerender(<MetadataValueEditModal summary={{...summary, metadata_key: "Rights"}} onClose={onClose}/>);
        fireEvent.click(screen.getByRole("button", {name: "Save"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("Failed to start the metadata rewrite"));
        expect(updateValue).toHaveBeenLastCalledWith(expect.objectContaining({metadata_key: "Rights"}));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("keeps the dialog open and sends nothing when the form does not validate", async () => {
        // The dialog's own form has no rules, so a failing validation is injected through the form instance
        const useForm = Form.useForm;
        jest.spyOn(Form, "useForm").mockImplementation(() => {
            const [form] = useForm();
            return [{...form, validateFields: () => Promise.reject(new Error("invalid"))}];
        });
        const onClose = jest.fn();
        render(<MetadataValueEditModal summary={summary} onClose={onClose}/>);
        await waitFor(() => expect(screen.getByText("Edit metadata value")).toBeTruthy());

        fireEvent.click(screen.getByRole("button", {name: "Save"}));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(updateValue).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByText("Edit metadata value")).toBeTruthy();
    });
});
