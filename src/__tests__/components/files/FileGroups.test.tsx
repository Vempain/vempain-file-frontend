/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {FileGroups} from "../../../components/files/FileGroups";
import {fileGroupAPI, imageFileAPI, publishAPI} from "../../../services";

const trackTask = jest.fn();

// A stable translation function: the screen memoizes its columns on `t`
const translate = (key: string) => key;
jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: translate})
}));

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask})
}));

jest.mock("../../../services", () => {
    const fileApi = () => ({findAllPageable: jest.fn()});
    return {
        archiveFileAPI: fileApi(), audioFileAPI: fileApi(), binaryFileAPI: fileApi(), dataFileAPI: fileApi(), documentFileAPI: fileApi(),
        executableFileAPI: fileApi(), fontFileAPI: fileApi(), iconFileAPI: fileApi(), imageFileAPI: fileApi(), interactiveFileAPI: fileApi(),
        musicFileAPI: fileApi(), thumbFileAPI: fileApi(), vectorFileAPI: fileApi(), videoFileAPI: fileApi(),
        fileGroupAPI: {findPageable: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn()},
        publishAPI: {publishFileGroup: jest.fn(), getPublishUsers: jest.fn()}
    };
});

jest.mock("../../../components/files/FileDetails", () => ({
    FileDetails: ({file}: { file: { filename: string } }) => <div>details of {file.filename}</div>
}));

jest.mock("../../../components/files/PublishAclEditor", () => ({
    PublishAclEditor: () => <div>acl editor</div>
}));

const filterProps = {setSelectedKeys: jest.fn(), confirm: jest.fn(), clearFilters: jest.fn(), close: jest.fn()};

/**
 * Reduced `usePagedTable`/`VempainTable`: the hook fetches the first page and reloads on demand; the table renders every
 * column of every row, an expand toggle per row (through `expandable`) and the filter dropdown of the first searchable column.
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

    function VempainTable({paged, columns = [], rowKey, expandable}: any) {
        const searchable = columns.find((column: any) => column.filterDropdown);
        return <div data-testid="table">
            {paged.dataSource.map((row: any) => {
                const key = typeof rowKey === "function" ? rowKey(row) : row[rowKey];
                const expanded = expandable?.expandedRowKeys?.includes(key);
                return <div key={key} data-testid="row">
                    {columns.map((column: any) => <span key={column.key}>
                        {column.render ? column.render(row[column.dataIndex], row) : String(row[column.dataIndex] ?? "")}
                    </span>)}
                    {expandable && <button onClick={() => expandable.onExpand(!expanded, row)}>expand {key}</button>}
                    {expanded && <div data-testid="expanded">{expandable.expandedRowRender(row)}</div>}
                </div>;
            })}
            {searchable && <div data-testid="filter">
                {searchable.filterDropdown({...filterProps, selectedKeys: [], visible: true, prefixCls: "x"})}
                {searchable.filterIcon(true)}
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

const findPageable = jest.mocked(fileGroupAPI.findPageable);
const findById = jest.mocked(fileGroupAPI.findById);
const create = jest.mocked(fileGroupAPI.create);
const update = jest.mocked(fileGroupAPI.update);
const remove = jest.mocked(fileGroupAPI.delete);
const publishFileGroup = jest.mocked(publishAPI.publishFileGroup);
const findImages = jest.mocked(imageFileAPI.findAllPageable);

const summer = {id: 1, path: "/trips/2024", group_name: "Summer", description: "Summer trip", file_count: 2, gallery_id: 9};
const winter = {id: 2, path: "/trips/2025", group_name: "Winter", description: "", file_count: null, gallery_id: null};

function fileRow(id: number, filename: string) {
    return {
        id,
        external_file_id: `ext-${id}`,
        filename,
        file_path: `/trips/${filename}`,
        filesize: id * 1024,
        mimetype: "image/jpeg",
        thumbnail_id: null,
        created: null
    };
}

function page<T>(content: T[], pageNumber = 0, last = true) {
    return {content, page: pageNumber, size: 10, total_elements: content.length, total_pages: 1, first: pageNumber === 0, last, empty: content.length === 0};
}

const accepted = {task_id: "t-1", type: "PUBLISH_FILE_GROUP", title: "Publish", status: "QUEUED", total_steps: 3};

function modal() {
    const modals = Array.from(document.querySelectorAll(".ant-modal")).filter(element => !element.closest(".ant-modal-wrap")?.getAttribute("style")?.includes("display: none"));
    return modals[modals.length - 1] as HTMLElement;
}

async function pickOption(combobox: HTMLElement, text: string) {
    fireEvent.mouseDown(combobox);
    const option = await screen.findByText(text, {selector: ".ant-select-item-option-content"});
    fireEvent.click(option);
}

describe("FileGroups", () => {
    beforeEach(() => {
        findPageable.mockReset();
        findById.mockReset();
        create.mockReset();
        update.mockReset();
        remove.mockReset();
        publishFileGroup.mockReset();
        findImages.mockReset();
        trackTask.mockReset();
        Object.values(filterProps).forEach(mock => mock.mockReset());
        findPageable.mockResolvedValue(page([summer, winter]) as never);
        findById.mockResolvedValue({...summer, files: [fileRow(1, "a.jpg"), fileRow(2, "b.jpg")]} as never);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("loads the groups sorted by path, expands a row into its files and opens the file details", async () => {
        render(<FileGroups/>);

        await waitFor(() => expect(findPageable).toHaveBeenCalledWith({page: 0, size: 10, sort_by: "path", direction: "ASC"}));
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));
        expect(within(screen.getAllByTestId("row")[0]).getByText("9")).toBeTruthy();
        expect(within(screen.getAllByTestId("row")[0]).getByText("2")).toBeTruthy();
        expect(within(screen.getAllByTestId("row")[1]).getByText("Winter")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", {name: "expand 1"}));
        await waitFor(() => expect(findById).toHaveBeenCalledWith(1));
        await waitFor(() => expect(within(screen.getByTestId("expanded")).getByRole("button", {name: "b.jpg"})).toBeTruthy());
        fireEvent.click(within(screen.getByTestId("expanded")).getByRole("button", {name: "b.jpg"}));
        await waitFor(() => expect(screen.getByText("details of b.jpg")).toBeTruthy());

        // Collapsing and expanding again reuses the loaded files
        fireEvent.click(screen.getByRole("button", {name: "expand 1"}));
        expect(screen.queryByTestId("expanded")).toBeNull();
        fireEvent.click(screen.getByRole("button", {name: "expand 1"}));
        expect(screen.getByTestId("expanded")).toBeTruthy();
        expect(findById).toHaveBeenCalledTimes(1);

        // A failed load of another group is reported and leaves it empty
        findById.mockRejectedValueOnce(new Error("gone"));
        fireEvent.click(screen.getByRole("button", {name: "expand 2"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("FileGroups.messages.fetchError"));
        expect(screen.getAllByTestId("expanded")).toHaveLength(2);
    });

    it("wires the column search dropdown to the table filter callbacks", async () => {
        render(<FileGroups/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        const filter = screen.getByTestId("filter");
        const input = within(filter).getByRole("textbox");
        fireEvent.change(input, {target: {value: "tri"}});
        expect(filterProps.setSelectedKeys).toHaveBeenLastCalledWith(["tri"]);
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

    it("creates a group with files picked by type, paged through the candidate list", async () => {
        create.mockResolvedValue(summer as never);
        findImages.mockResolvedValueOnce(page([fileRow(10, "x.jpg"), fileRow(11, "y.jpg")], 0, false) as never)
                .mockResolvedValueOnce(page([fileRow(11, "y.jpg"), fileRow(12, "z.jpg")], 1, true) as never);
        render(<FileGroups/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(screen.getByRole("button", {name: /FileGroups.actions.new/}));
        await waitFor(() => expect(within(modal()).getByText("FileGroups.modal.create.title")).toBeTruthy());

        // The path and the group name are required
        fireEvent.click(within(modal()).getByRole("button", {name: "Common.modal.create"}));
        await waitFor(() => expect(within(modal()).getByText("FileGroups.modal.path.validation.required")).toBeTruthy());
        expect(create).not.toHaveBeenCalled();

        fireEvent.change(within(modal()).getByLabelText("FileGroups.modal.path.label"), {target: {value: " /trips/2026 "}});
        fireEvent.change(within(modal()).getByLabelText("FileGroups.modal.group_name.label"), {target: {value: "Spring"}});
        fireEvent.change(within(modal()).getByLabelText("FileGroups.modal.description.label"), {target: {value: "Spring trip"}});

        // Choosing a type loads the first page of candidates of that type
        const [typeSelect, fileSelect] = within(modal()).getAllByRole("combobox");
        await pickOption(typeSelect, "FileTypeEnum.image");
        await waitFor(() => expect(findImages).toHaveBeenCalledWith({page: 0, size: 50}));
        expect((within(modal()).getByRole("button", {name: "FileGroups.modal.files.add"}) as HTMLButtonElement).disabled).toBe(true);

        await pickOption(fileSelect, "x.jpg — /trips/x.jpg");
        // The dropdown footer loads the next page, which is appended, and then reports the end of the list
        fireEvent.click(await screen.findByRole("button", {name: "FileGroups.modal.files.loadMore"}));
        await waitFor(() => expect(findImages).toHaveBeenCalledWith({page: 1, size: 50}));
        await screen.findByText("z.jpg — /trips/z.jpg", {selector: ".ant-select-item-option-content"});
        expect((await screen.findByRole("button", {name: "FileGroups.modal.files.noMore"}) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByText("z.jpg — /trips/z.jpg", {selector: ".ant-select-item-option-content"}));

        fireEvent.click(within(modal()).getByRole("button", {name: "FileGroups.modal.files.add"}));
        await waitFor(() => expect(within(modal()).getByRole("button", {name: "x.jpg"})).toBeTruthy());
        expect(within(modal()).getByRole("button", {name: "z.jpg"})).toBeTruthy();
        // Adding the same selection again changes nothing; a file can be removed from the group
        fireEvent.click(within(modal()).getByRole("button", {name: "FileGroups.modal.files.add"}));
        fireEvent.click(within(modal()).getAllByRole("button", {name: /delete/})[1]);
        fireEvent.click(await screen.findByText("Common.popconfirm.yes"));
        await waitFor(() => expect(within(modal()).queryByRole("button", {name: "z.jpg"})).toBeNull());
        // The file name of a selected file opens its details
        fireEvent.click(within(modal()).getByRole("button", {name: "x.jpg"}));
        await waitFor(() => expect(screen.getByText("details of x.jpg")).toBeTruthy());
        fireEvent.click(within(modal()).getByRole("button", {name: "Close"}));
        await waitFor(() => expect(within(modal()).queryByText("details of x.jpg")).toBeNull());

        fireEvent.click(within(modal()).getByRole("button", {name: "Common.modal.create"}));
        await waitFor(() => expect(create).toHaveBeenCalledWith({
            id: 0,
            path: "/trips/2026",
            group_name: "Spring",
            description: "Spring trip",
            file_ids: [10]
        }));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("FileGroups.messages.createSuccess"));
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(2));
    }, 15000);

    it("reports candidate loading and creation failures", async () => {
        create.mockRejectedValue(new Error("conflict"));
        findImages.mockRejectedValue(new Error("down"));
        render(<FileGroups/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(screen.getByRole("button", {name: /FileGroups.actions.new/}));
        await waitFor(() => expect(within(modal()).getByText("FileGroups.modal.create.title")).toBeTruthy());
        await pickOption(within(modal()).getAllByRole("combobox")[0], "FileTypeEnum.image");
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("FileGroups.messages.fetchError"));

        fireEvent.change(within(modal()).getByLabelText("FileGroups.modal.path.label"), {target: {value: "/x"}});
        fireEvent.change(within(modal()).getByLabelText("FileGroups.modal.group_name.label"), {target: {value: "X"}});
        fireEvent.click(within(modal()).getByRole("button", {name: "Common.modal.create"}));
        await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({path: "/x", group_name: "X", description: "", file_ids: []})));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("FileGroups.messages.createError"));
    });

    it("edits a group with its preloaded files and reports failures", async () => {
        update.mockResolvedValueOnce(summer as never).mockRejectedValueOnce(new Error("conflict"));
        render(<FileGroups/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: /edit/}));
        await waitFor(() => expect(within(modal()).getByText("FileGroups.modal.edit.title")).toBeTruthy());
        await waitFor(() => expect(within(modal()).getByRole("button", {name: "a.jpg"})).toBeTruthy());
        expect((within(modal()).getByLabelText("FileGroups.modal.group_name.label") as HTMLInputElement).value).toBe("Summer");

        fireEvent.click(within(modal()).getByRole("button", {name: "Common.modal.save"}));
        await waitFor(() => expect(update).toHaveBeenCalledWith({
            id: 1,
            path: "/trips/2024",
            group_name: "Summer",
            description: "Summer trip",
            file_ids: [1, 2]
        }));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("FileGroups.messages.updateSuccess"));

        // The files of the second group cannot be loaded; saving it fails
        findById.mockRejectedValueOnce(new Error("gone"));
        fireEvent.click(within(screen.getAllByTestId("row")[1]).getByRole("button", {name: /edit/}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("FileGroups.messages.fetchError"));
        fireEvent.click(within(modal()).getByRole("button", {name: "Common.modal.save"}));
        await waitFor(() => expect(update).toHaveBeenLastCalledWith({id: 2, path: "/trips/2025", group_name: "Winter", description: "", file_ids: []}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("FileGroups.messages.updateError"));
        fireEvent.click(within(modal()).getByRole("button", {name: "Common.modal.cancel"}));
    });

    it("deletes a group after confirmation and reports refusals and failures", async () => {
        remove.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockRejectedValueOnce(new Error("down"));
        render(<FileGroups/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        for (const expected of ["FileGroups.messages.deleteSuccess", "FileGroups.messages.deleteError", "FileGroups.messages.deleteError"]) {
            fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: /delete/}));
            fireEvent.click((await screen.findAllByText("Common.popconfirm.yes")).at(-1)!);
            await waitFor(() => expect(expected.endsWith("Success") ? message.success : message.error).toHaveBeenCalledWith(expected));
        }
        expect(remove).toHaveBeenCalledTimes(3);
        expect(remove).toHaveBeenCalledWith(1);
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(2));
    });

    it("publishes a group as a gallery through the background task", async () => {
        publishFileGroup.mockResolvedValueOnce(accepted as never).mockRejectedValueOnce(new Error("down"));
        render(<FileGroups/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: /FileGroups.actions.publish/}));
        await waitFor(() => expect(within(modal()).getByText("PublishFileGroup.modal.title")).toBeTruthy());
        expect((within(modal()).getByLabelText("PublishFileGroup.modal.galleryName.label") as HTMLInputElement).value).toBe("Summer");
        expect(within(modal()).getByText("acl editor")).toBeTruthy();

        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(publishFileGroup).toHaveBeenCalledWith({
            file_group_id: 1,
            gallery_name: "Summer",
            gallery_description: "Summer trip",
            acls: null
        }));
        expect(trackTask).toHaveBeenCalledWith(accepted, expect.objectContaining({onFinished: expect.any(Function)}));
        expect(message.success).toHaveBeenCalledWith("PublishFileGroup.messages.publishStarted");
        trackTask.mock.calls[0][1].onFinished();
        await waitFor(() => expect(findPageable).toHaveBeenCalledTimes(2));

        // Empty gallery texts are sent as null; a failed publish is reported and the modal can be cancelled
        fireEvent.click(within(screen.getAllByTestId("row")[1]).getByRole("button", {name: /FileGroups.actions.publish/}));
        await waitFor(() => expect((within(modal()).getByLabelText("PublishFileGroup.modal.galleryName.label") as HTMLInputElement).value).toBe("Winter"));
        fireEvent.change(within(modal()).getByLabelText("PublishFileGroup.modal.galleryName.label"), {target: {value: ""}});
        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(publishFileGroup).toHaveBeenLastCalledWith({file_group_id: 2, gallery_name: null, gallery_description: null, acls: null}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("PublishFileGroup.messages.publishError"));
        fireEvent.click(within(modal()).getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByText("acl editor")).toBeNull());
    });
});
