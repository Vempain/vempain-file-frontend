import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {FileTagEditor} from "../../../components/tags/FileTagEditor";
import {tagAPI} from "../../../services";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string, options?: { error?: string }) => options?.error === undefined ? key : `${key}: ${options.error}`})
}));

jest.mock("../../../services", () => ({
    tagAPI: {findAll: jest.fn(), addTag: jest.fn(), removeTag: jest.fn(), replaceTag: jest.fn(), renameTag: jest.fn()}
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

const findAll = jest.mocked(tagAPI.findAll);
const addTag = jest.mocked(tagAPI.addTag);
const removeTag = jest.mocked(tagAPI.removeTag);
const replaceTag = jest.mocked(tagAPI.replaceTag);
const renameTag = jest.mocked(tagAPI.renameTag);

const tags = [
    {id: 2, tag_name: "sea", tag_name_de: "", tag_name_en: "", tag_name_es: "", tag_name_fi: "", tag_name_sv: ""},
    {id: 1, tag_name: "nature", tag_name_de: "", tag_name_en: "", tag_name_es: "", tag_name_fi: "", tag_name_sv: ""}
];

/** The active tab pane (inactive panes are not rendered until they have been visited) */
function activePane() {
    return document.querySelector('[role="tabpanel"][aria-hidden="false"]') as HTMLElement;
}

/** Adds a file id through the tag-mode select of the active pane */
function addFileId(value: string) {
    const combobox = within(activePane()).getAllByRole("combobox").at(-1)!;
    fireEvent.change(combobox, {target: {value}});
    fireEvent.keyDown(combobox, {key: "Enter", keyCode: 13});
}

/** Picks an option of the n-th select of the active pane */
async function pickOption(index: number, text: string) {
    const combobox = within(activePane()).getAllByRole("combobox")[index];
    fireEvent.mouseDown(combobox);
    const options = await waitFor(() => {
        const found = Array.from(document.querySelectorAll(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content"))
                .filter(option => option.textContent === text);
        expect(found.length).toBeGreaterThan(0);
        return found;
    });
    fireEvent.click(options[options.length - 1]);
}

describe("FileTagEditor", () => {
    beforeEach(() => {
        findAll.mockReset();
        addTag.mockReset();
        removeTag.mockReset();
        replaceTag.mockReset();
        renameTag.mockReset();
        findAll.mockResolvedValue(tags as never);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("loads tags only when a tag-dependent tab is opened", async () => {
        render(<FileTagEditor/>);
        expect(findAll).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.rename"}));
        await waitFor(() => expect(findAll).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.add"}));
        expect(findAll).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.replace"}));
        await waitFor(() => expect(findAll).toHaveBeenCalledTimes(2));
        findAll.mockRejectedValueOnce(new Error("down"));
        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.remove"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("FileTagEditor.messages.fetchError: Error: down"));
    });

    it("adds a tag with its translations to the chosen files", async () => {
        addTag.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("down"));
        render(<FileTagEditor/>);

        // Nothing is sent without files and a tag name
        fireEvent.click(within(activePane()).getByRole("button", {name: "FileTagEditor.actions.apply"}));
        expect(message.error).toHaveBeenCalledWith("FileTagEditor.messages.required");

        fireEvent.change(screen.getByPlaceholderText("FileTagEditor.fields.tag_name"), {target: {value: "forest"}});
        fireEvent.click(screen.getByRole("button", {name: "FileTagEditor.actions.copyDefault"}));
        expect((screen.getByPlaceholderText("FileTagEditor.fields.tag_name_fi") as HTMLInputElement).value).toBe("forest");
        fireEvent.change(screen.getByPlaceholderText("FileTagEditor.fields.tag_name_fi"), {target: {value: "metsä"}});
        addFileId("12");
        addFileId("abc");
        fireEvent.click(within(activePane()).getByRole("button", {name: "FileTagEditor.actions.apply"}));

        await waitFor(() => expect(addTag).toHaveBeenCalledWith({
            tag_name: "forest", tag_name_de: "forest", tag_name_en: "forest", tag_name_es: "forest", tag_name_fi: "metsä", tag_name_sv: "forest", file_ids: [12]
        }));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("FileTagEditor.messages.success"));

        // The button ignores clicks while the previous request is running
        const apply = await within(activePane()).findByRole("button", {name: "FileTagEditor.actions.apply"});
        fireEvent.click(apply);
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("FileTagEditor.messages.failed: Error: down"));
    });

    it("renames a tag in the chosen files with new translations", async () => {
        renameTag.mockResolvedValue(undefined);
        render(<FileTagEditor/>);
        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.rename"}));
        await waitFor(() => expect(findAll).toHaveBeenCalledTimes(1));

        // The source tag and the files are required, then the new name
        addFileId("3");
        fireEvent.click(within(activePane()).getByRole("button", {name: "FileTagEditor.actions.apply"}));
        expect(message.error).toHaveBeenLastCalledWith("FileTagEditor.messages.required");
        await pickOption(0, "nature");
        fireEvent.click(within(activePane()).getByRole("button", {name: "FileTagEditor.actions.apply"}));
        expect(message.error).toHaveBeenLastCalledWith("FileTagEditor.messages.replacementRequired");

        fireEvent.change(screen.getByPlaceholderText("FileTagEditor.fields.newName"), {target: {value: "wild"}});
        fireEvent.click(within(activePane()).getByRole("button", {name: "FileTagEditor.actions.copyDefault"}));
        fireEvent.change(within(activePane()).getByPlaceholderText("FileTagEditor.fields.tag_name_sv"), {target: {value: "vild"}});
        fireEvent.click(within(activePane()).getByRole("button", {name: "FileTagEditor.actions.apply"}));

        await waitFor(() => expect(renameTag).toHaveBeenCalledWith({
            tag_name: "nature",
            replacement_tag_name: "wild",
            tag_name_de: "wild",
            tag_name_en: "wild",
            tag_name_es: "wild",
            tag_name_fi: "wild",
            tag_name_sv: "vild",
            file_ids: [3]
        }));
    });

    it("replaces a tag with another one in the chosen files", async () => {
        replaceTag.mockResolvedValue(undefined);
        render(<FileTagEditor/>);
        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.replace"}));
        await waitFor(() => expect(findAll).toHaveBeenCalledTimes(1));

        addFileId("5");
        await pickOption(0, "sea");
        fireEvent.click(within(activePane()).getByRole("button", {name: "FileTagEditor.actions.apply"}));
        expect(message.error).toHaveBeenLastCalledWith("FileTagEditor.messages.replacementRequired");

        await pickOption(1, "nature");
        fireEvent.click(within(activePane()).getByRole("button", {name: "FileTagEditor.actions.apply"}));
        await waitFor(() => expect(replaceTag).toHaveBeenCalledWith({tag_name: "sea", replacement_tag_name: "nature", file_ids: [5]}));
    });

    it("removes a tag from the chosen files", async () => {
        removeTag.mockResolvedValue(undefined);
        render(<FileTagEditor/>);
        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.remove"}));
        await waitFor(() => expect(findAll).toHaveBeenCalledTimes(1));

        await pickOption(0, "sea");
        addFileId("8");
        fireEvent.click(within(activePane()).getByRole("button", {name: "FileTagEditor.actions.remove"}));
        await waitFor(() => expect(removeTag).toHaveBeenCalledWith({tag_name: "sea", replacement_tag_name: undefined, file_ids: [8]}));
    });
});
