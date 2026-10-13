/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {TagList} from "../../../components/tags/TagList";
import {tagAPI} from "../../../services";
import type {TagResponse} from "../../../models";

jest.mock("react-router-dom", () => ({
    Link: ({children, to}: { children: string; to: string }) => <a href={to}>{children}</a>
}));

// A stable translation function: the screen memoizes its column search props on `t`
const translate = (key: string, options?: { defaultValue?: string; error?: string }) => options?.error === undefined ? key : `${key}: ${options.error}`;
jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: translate})
}));

jest.mock("../../../services", () => ({
    tagAPI: {
        findPageable: jest.fn(),
        update: jest.fn(),
        removeTagFromAll: jest.fn(),
        replaceTagAcrossAll: jest.fn(),
        renameTagAcrossAll: jest.fn()
    }
}));

const filterProps = {setSelectedKeys: jest.fn(), confirm: jest.fn(), clearFilters: jest.fn(), close: jest.fn()};

/**
 * Reduced `usePagedTable`/`VempainTable`: the hook fetches the first page and reloads on demand; the table renders every
 * column of every row and the filter dropdown of the first searchable column.
 */
jest.mock("@vempain/vempain-auth-frontend", () => {
    const R = jest.requireActual("react") as typeof React;

    function usePagedTable(fetcher: (request: any) => Promise<any>, options: any = {}) {
        const [dataSource, setDataSource] = R.useState<any[]>([]);
        const [loading, setLoading] = R.useState(true);
        const [reloadCounter, setReloadCounter] = R.useState(0);
        const fetcherRef = R.useRef(fetcher);
        fetcherRef.current = fetcher;
        R.useEffect(() => {
            setLoading(true);
            fetcherRef.current({page: 0, size: options.defaultPageSize ?? 10, sort_by: options.defaultSortBy, direction: "ASC"})
                    .then((response: any) => {
                        setDataSource(response?.content ?? []);
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
        }, [reloadCounter, options.defaultPageSize, options.defaultSortBy]);
        return {
            dataSource,
            loading,
            pagination: {},
            handleTableChange: () => undefined,
            reload: () => setReloadCounter(value => value + 1),
            contextHolder: null
        };
    }

    function VempainTable({paged, columns = [], rowKey}: any) {
        const searchable = columns.find((column: any) => column.filterDropdown);
        return <div data-testid="table">
            {paged.dataSource.map((row: any) => <div key={row[rowKey]} data-testid="row">
                {columns.map((column: any) => <span key={column.key}>
                    {column.render ? column.render(row[column.dataIndex], row) : String(row[column.dataIndex] ?? "")}
                </span>)}
            </div>)}
            {searchable && <div data-testid="filter">
                {searchable.filterDropdown({...filterProps, selectedKeys: [], visible: true, prefixCls: "x"})}
                {searchable.filterIcon(false)}
                <button onClick={() => searchable.filterDropdownProps.onOpenChange(true)}>open filter</button>
                <button onClick={() => searchable.filterDropdownProps.onOpenChange(false)}>close filter</button>
            </div>}
        </div>;
    }

    return {usePagedTable, VempainTable};
}, {virtual: true});

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

const findPageable = jest.mocked(tagAPI.findPageable);
const update = jest.mocked(tagAPI.update);
const removeTagFromAll = jest.mocked(tagAPI.removeTagFromAll);
const replaceTagAcrossAll = jest.mocked(tagAPI.replaceTagAcrossAll);
const renameTagAcrossAll = jest.mocked(tagAPI.renameTagAcrossAll);

const nature: TagResponse = {
    id: 1,
    tag_name: "nature",
    tag_name_de: "Natur",
    tag_name_en: "nature",
    tag_name_es: "naturaleza",
    tag_name_fi: "luonto",
    tag_name_sv: "natur"
};
const city: TagResponse = {id: 2, tag_name: "city", tag_name_de: "", tag_name_en: "", tag_name_es: "", tag_name_fi: "", tag_name_sv: ""};

function page(content: TagResponse[], last = true) {
    return {content, page: 0, size: 10, total_elements: content.length, total_pages: 1, first: true, last, empty: content.length === 0};
}

const accepted = {task_id: "t-1", type: "TAG_REMOVE_FROM_ALL", title: "Tag", status: "QUEUED", total_steps: 2};

/** The confirm dialog opened by Modal.useModal; its buttons are the last ones rendered into the document body. */
function confirmDialog() {
    const dialogs = document.querySelectorAll(".ant-modal-confirm");
    return dialogs[dialogs.length - 1] as HTMLElement;
}

async function waitForConfirm() {
    await waitFor(() => expect(document.querySelector(".ant-modal-confirm")).not.toBeNull());
    return confirmDialog();
}

describe("TagList", () => {
    beforeEach(() => {
        findPageable.mockReset();
        update.mockReset();
        removeTagFromAll.mockReset();
        replaceTagAcrossAll.mockReset();
        renameTagAcrossAll.mockReset();
        Object.values(filterProps).forEach(mock => mock.mockReset());
        findPageable.mockResolvedValue(page([nature, city]) as never);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("loads the first page through the pageable API sorted by tag name and renders empty translations as a dash", async () => {
        render(<TagList/>);

        await waitFor(() => expect(findPageable).toHaveBeenCalledWith({page: 0, size: 10, sort_by: "tag_name", direction: "ASC"}));
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));
        expect(screen.getByText("Natur")).toBeTruthy();
        expect(within(screen.getAllByTestId("row")[1]).getAllByText("-")).toHaveLength(5);
        expect(screen.getAllByRole("link", {name: "TagList.actions.viewTaggedFiles"})[0].getAttribute("href")).toBe("/tags/1");
    });

    it("wires the column search dropdown to the table filter callbacks", async () => {
        render(<TagList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        const filter = screen.getByTestId("filter");
        const input = within(filter).getByRole("textbox");
        fireEvent.change(input, {target: {value: "nat"}});
        expect(filterProps.setSelectedKeys).toHaveBeenLastCalledWith(["nat"]);
        fireEvent.change(input, {target: {value: ""}});
        expect(filterProps.setSelectedKeys).toHaveBeenLastCalledWith([]);
        fireEvent.keyDown(input, {key: "Enter", keyCode: 13});
        fireEvent.click(within(filter).getByRole("button", {name: /Common.search/}));
        fireEvent.click(within(filter).getByRole("button", {name: "Common.reset"}));
        expect(filterProps.confirm).toHaveBeenCalledTimes(3);
        expect(filterProps.clearFilters).toHaveBeenCalledTimes(1);
        expect(filterProps.close).toHaveBeenCalledTimes(1);

        const select = jest.spyOn(HTMLInputElement.prototype, "select").mockImplementation(() => undefined);
        fireEvent.click(within(filter).getByRole("button", {name: "close filter"}));
        fireEvent.click(within(filter).getByRole("button", {name: "open filter"}));
        await waitFor(() => expect(select).toHaveBeenCalled());
    });

    it("edits a row inline, saves the changed translations and reloads", async () => {
        update.mockResolvedValue(nature);
        render(<TagList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[1]).getByRole("button", {name: "TagList.actions.edit"}));
        const row = screen.getAllByTestId("row")[1];
        const save = within(row).getByRole("button", {name: "TagList.actions.save"}) as HTMLButtonElement;
        expect(save.disabled).toBe(true);

        const inputs = within(row).getAllByRole("textbox");
        expect(inputs).toHaveLength(6);
        fireEvent.change(inputs[2], {target: {value: "City"}});
        expect(save.disabled).toBe(false);
        fireEvent.click(save);

        await waitFor(() => expect(update).toHaveBeenCalledWith({
            id: 2, tag_name: "city", tag_name_de: "", tag_name_en: "City", tag_name_es: "", tag_name_fi: "", tag_name_sv: ""
        }));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("TagList.messages.updateSuccess"));
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(2));
        expect(within(screen.getAllByTestId("row")[1]).queryAllByRole("textbox")).toHaveLength(0);
    });

    it("refuses to save without a tag name, reports a failed update and cancels an edit", async () => {
        update.mockRejectedValue(new Error("conflict"));
        render(<TagList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "TagList.actions.edit"}));
        let row = screen.getAllByTestId("row")[0];
        fireEvent.change(within(row).getAllByRole("textbox")[0], {target: {value: ""}});
        fireEvent.click(within(row).getByRole("button", {name: "TagList.actions.save"}));
        expect(message.error).toHaveBeenCalledWith("TagList.messages.tagNameRequired");
        expect(update).not.toHaveBeenCalled();

        fireEvent.change(within(row).getAllByRole("textbox")[0], {target: {value: "wild"}});
        fireEvent.click(within(row).getByRole("button", {name: "TagList.actions.save"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("TagList.messages.updateFailedWithReason: Error: conflict"));
        expect(update).toHaveBeenCalledWith(expect.objectContaining({id: 1, tag_name: "wild"}));
        await waitFor(() => expect(within(screen.getAllByTestId("row")[0]).queryAllByRole("textbox")).toHaveLength(0));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "TagList.actions.edit"}));
        row = screen.getAllByTestId("row")[0];
        fireEvent.click(within(row).getByRole("button", {name: "TagList.actions.cancel"}));
        expect(within(screen.getAllByTestId("row")[0]).queryAllByRole("textbox")).toHaveLength(0);
    });

    it("removes a tag from every file after confirmation and reports failures", async () => {
        removeTagFromAll.mockResolvedValueOnce(accepted as never).mockRejectedValueOnce(new Error("down"));
        render(<TagList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "TagList.actions.removeAll"}));
        let dialog = await waitForConfirm();
        expect(within(dialog).getAllByText("TagList.messages.confirmAll").length).toBeGreaterThan(0);
        fireEvent.click(within(dialog).getByRole("button", {name: "OK"}));

        await waitFor(() => expect(removeTagFromAll).toHaveBeenCalledWith({tag_name: "nature", replacement_tag_name: undefined, file_ids: []}));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("TagList.messages.actionSuccess"));
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(2));

        fireEvent.click(within(screen.getAllByTestId("row")[1]).getByRole("button", {name: "TagList.actions.removeAll"}));
        await waitFor(() => expect(document.querySelectorAll(".ant-modal-confirm").length).toBeGreaterThanOrEqual(1));
        dialog = confirmDialog();
        fireEvent.click(within(dialog).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("TagList.messages.actionFailed: Error: down"));
    });

    it("renames a tag across every file with the prompted name and does nothing without one", async () => {
        renameTagAcrossAll.mockResolvedValue(accepted as never);
        const prompt = jest.spyOn(window, "prompt").mockReturnValueOnce("wilderness").mockReturnValueOnce(null);
        render(<TagList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "TagList.actions.renameAll"}));
        expect(prompt).toHaveBeenCalledWith("TagList.messages.replacementPrompt");
        const dialog = await waitForConfirm();
        fireEvent.click(within(dialog).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(renameTagAcrossAll).toHaveBeenCalledWith({tag_name: "nature", replacement_tag_name: "wilderness", file_ids: []}));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "TagList.actions.renameAll"}));
        expect(prompt).toHaveBeenCalledTimes(2);
        expect(renameTagAcrossAll).toHaveBeenCalledTimes(1);
    });

    it("replaces a tag across every file with a tag chosen from the paged replacement list", async () => {
        replaceTagAcrossAll.mockResolvedValue(accepted as never);
        render(<TagList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        // The replacement list loads the tags except the one being replaced
        findPageable.mockResolvedValueOnce(page([nature, city, {...city, id: 3, tag_name: "sea"}], false) as never);
        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "TagList.actions.replaceAll"}));
        const dialog = await waitForConfirm();
        await waitFor(() => expect(findPageable).toHaveBeenLastCalledWith({page: 0, size: 200, sort_by: "tag_name", direction: "ASC", case_sensitive: false}));

        // Searching reloads the options; scrolling to the end of the list appends the next page
        findPageable.mockResolvedValueOnce(page([city], false) as never);
        const combobox = within(dialog).getByRole("combobox");
        fireEvent.change(combobox, {target: {value: "ci"}});
        await waitFor(() => expect(findPageable).toHaveBeenLastCalledWith(expect.objectContaining({search: "ci", page: 0})));
        findPageable.mockResolvedValueOnce(page([{...city, id: 4, tag_name: "circus"}], true) as never);
        const list = await waitFor(() => {
            const holder = document.querySelector(".ant-select-dropdown-list-holder");
            expect(holder).not.toBeNull();
            return holder!;
        });
        fireEvent.scroll(list);
        await waitFor(() => expect(findPageable).toHaveBeenLastCalledWith(expect.objectContaining({search: "ci", page: 1})));
        const option = await screen.findByText("circus", {selector: ".ant-select-item-option-content"});
        // The last page was reached: another scroll fetches nothing
        const calls = findPageable.mock.calls.length;
        fireEvent.scroll(list);
        expect(findPageable).toHaveBeenCalledTimes(calls);

        fireEvent.click(option);
        fireEvent.click(within(dialog).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(replaceTagAcrossAll).toHaveBeenCalledWith({tag_name: "nature", replacement_tag_name: "circus", file_ids: []}));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("TagList.messages.actionSuccess"));
    });

    it("reports a failed replacement list load and ignores superseded responses", async () => {
        render(<TagList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        let resolveFirst: (value: unknown) => void = () => undefined;
        findPageable.mockReturnValueOnce(new Promise(resolve => {
            resolveFirst = resolve;
        }) as never);
        fireEvent.click(within(screen.getAllByTestId("row")[1]).getByRole("button", {name: "TagList.actions.replaceAll"}));
        const dialog = await waitForConfirm();
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(2));

        // A search supersedes the initial load, whose late result (and late failure) is ignored
        findPageable.mockRejectedValueOnce(new Error("down"));
        fireEvent.change(within(dialog).getByRole("combobox"), {target: {value: "x"}});
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("TagList.messages.fetchError: Error: down"));
        await act(async () => resolveFirst(page([nature])));
        fireEvent.mouseDown(within(dialog).getByRole("combobox"));
        expect(screen.queryByText("nature", {selector: ".ant-select-item-option-content"})).toBeNull();
    });
});
