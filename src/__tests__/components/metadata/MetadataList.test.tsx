/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {MetadataList} from "../../../components/metadata/MetadataList";
import {metadataAPI} from "../../../services";
import type {FileResponse, MetadataSummaryResponse} from "../../../models";

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
    metadataAPI: {
        findSummaries: jest.fn(),
        findFiles: jest.fn(),
        updateValue: jest.fn()
    },
    userAPI: {}
}));

// The tools barrel pulls in Vite-only modules (import.meta); only the helpers the screens use are provided
jest.mock("../../../tools", () => ({
    fileTypeEnum2Tag: (value: string) => <span>{value}</span>,
    formatByteSize: (value: number) => `${value} B`,
    metadataRowKey: (row: { metadata_group: string; metadata_key: string; metadata_value: string }) =>
            `${row.metadata_group}|${row.metadata_key}|${row.metadata_value}`
}));

jest.mock("../../../components/files", () => ({
    FileDetails: ({file}: { file: { filename: string } }) => <div>details of {file.filename}</div>
}));

/**
 * A reduced `usePagedTable`/`VempainTable` pair: the hook keeps the page/sort query, refetches when the `deps` change and
 * resets the page through `setFilter`; the table renders every column of every row, an expand toggle per row and a button
 * that sorts by file size, so that the screen's requests can be asserted.
 */
jest.mock("@vempain/vempain-auth-frontend", () => {
    const R = jest.requireActual("react") as typeof React;

    function usePagedTable(fetcher: (request: any) => Promise<any>, options: any = {}) {
        const [query, setQuery] = R.useState<any>({
            page: 0,
            size: options.defaultPageSize ?? 10,
            sortBy: options.defaultSortBy,
            direction: options.defaultSortBy ? "ASC" : undefined
        });
        const [reloadCounter, setReloadCounter] = R.useState(0);
        const [dataSource, setDataSource] = R.useState<any[]>([]);
        const [loading, setLoading] = R.useState(true);
        const fetcherRef = R.useRef(fetcher);
        fetcherRef.current = fetcher;
        const depsKey = JSON.stringify(options.deps ?? []);
        R.useEffect(() => {
            setLoading(true);
            fetcherRef.current({page: query.page, size: query.size, sort_by: query.sortBy, direction: query.direction})
                    .then((response: any) => {
                        setDataSource(response?.content ?? []);
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
        }, [query, depsKey, reloadCounter]);
        return {
            dataSource,
            loading,
            pagination: {},
            handleTableChange: (pagination: any, _filters: any, sorter: any) => setQuery((previous: any) => ({
                ...previous,
                page: Math.max(0, (pagination?.current ?? 1) - 1),
                sortBy: sorter?.field,
                direction: sorter?.order === "descend" ? "DESC" : "ASC"
            })),
            setFilter: () => setQuery((previous: any) => ({...previous, page: 0})),
            reload: () => setReloadCounter((value: number) => value + 1),
            contextHolder: null
        };
    }

    function VempainTable({paged, columns = [], rowKey, expandable}: any) {
        const [expanded, setExpanded] = R.useState<Record<string, boolean>>({});
        return <div data-testid="table">
            {paged.dataSource.map((row: any) => {
                const key = typeof rowKey === "function" ? rowKey(row) : row[rowKey];
                return <div key={key} data-testid="row">
                    {columns.map((column: any) => <span key={column.key}>
                        {column.render ? column.render(row[column.dataIndex], row) : String(row[column.dataIndex] ?? "")}
                    </span>)}
                    {expandable && <button onClick={() => setExpanded(current => ({...current, [key]: !current[key]}))}>expand</button>}
                    {expandable && expanded[key] && <div data-testid="expanded">{expandable.expandedRowRender(row)}</div>}
                </div>;
            })}
            <button onClick={() => paged.handleTableChange({current: 1, pageSize: 10}, {}, {field: "filesize", order: "descend"})}>sort by size</button>
        </div>;
    }

    return {usePagedTable, VempainTable};
}, {virtual: true});

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

const findSummaries = jest.mocked(metadataAPI.findSummaries);
const findFiles = jest.mocked(metadataAPI.findFiles);
const updateValue = jest.mocked(metadataAPI.updateValue);

const creator: MetadataSummaryResponse = {metadata_group: "XMP-dc", metadata_key: "Creator", metadata_value: "Jane Doe", file_count: 3, writable: true};
const imageSize: MetadataSummaryResponse = {metadata_group: "Composite", metadata_key: "ImageSize", metadata_value: "8x8", file_count: 1, writable: false};

function page<T>(content: T[]) {
    return {content, page: 0, size: 10, total_elements: content.length, total_pages: 1, first: true, last: true, empty: content.length === 0};
}

describe("MetadataList", () => {
    beforeEach(() => {
        findSummaries.mockReset();
        findFiles.mockReset();
        updateValue.mockReset();
        trackTask.mockReset();
        findSummaries.mockResolvedValue(page([creator, imageSize]) as never);
        findFiles.mockResolvedValue(page([{id: 7, filename: "holiday.jpg", file_path: "/2024", file_type: "IMAGE", filesize: 2048} as FileResponse]) as never);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
    });

    it("loads the summaries sorted by key and disables editing of read-only groups", async () => {
        render(<MetadataList/>);

        await waitFor(() => expect(findSummaries).toHaveBeenCalledWith({page: 0, size: 10, sort_by: "metadata_key", direction: "ASC"}));
        await waitFor(() => expect(screen.getByText("Jane Doe")).toBeTruthy());
        const rows = screen.getAllByTestId("row");
        expect((within(rows[0]).getByRole("button", {name: "Edit value"}) as HTMLButtonElement).disabled).toBe(false);
        expect((within(rows[1]).getByRole("button", {name: "Edit value"}) as HTMLButtonElement).disabled).toBe(true);
    });

    it("sends the key and value filters with the next request", async () => {
        render(<MetadataList/>);
        await waitFor(() => expect(findSummaries).toHaveBeenCalledTimes(1));

        fireEvent.change(screen.getByLabelText("Key"), {target: {value: "creat"}});
        fireEvent.change(screen.getByLabelText("Value"), {target: {value: " jane "}});
        fireEvent.click(screen.getByRole("button", {name: /Filter/}));

        await waitFor(() => expect(findSummaries).toHaveBeenLastCalledWith({
            page: 0, size: 10, sort_by: "metadata_key", direction: "ASC", metadata_key: "creat", metadata_value: "jane"
        }));
    });

    it("expands a row into its files, ten at a time, sorts them and opens the file details", async () => {
        render(<MetadataList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByText("expand"));

        await waitFor(() => expect(findFiles).toHaveBeenCalledWith({
            metadata_group: "XMP-dc", metadata_key: "Creator", metadata_value: "Jane Doe", page: 0, size: 10, sort_by: "filename", direction: "ASC"
        }));
        await waitFor(() => expect(screen.getByText("holiday.jpg")).toBeTruthy());

        const expanded = screen.getByTestId("expanded");
        fireEvent.change(within(expanded).getByLabelText("Filter by file name"), {target: {value: "holi"}});
        fireEvent.click(within(expanded).getByRole("button", {name: /Filter/}));
        await waitFor(() => expect(findFiles).toHaveBeenLastCalledWith(expect.objectContaining({filename: "holi", size: 10})));

        fireEvent.click(within(expanded).getByText("sort by size"));
        await waitFor(() => expect(findFiles).toHaveBeenLastCalledWith(expect.objectContaining({sort_by: "filesize", direction: "DESC"})));

        fireEvent.click(screen.getByText("holiday.jpg"));
        await waitFor(() => expect(screen.getByText("details of holiday.jpg")).toBeTruthy());
    });

    it("rewrites the value through the background task and tracks it", async () => {
        const accepted = {task_id: "t-1", type: "METADATA_UPDATE_VALUE", title: "Rewrite XMP-dc:Creator in 3 files", status: "QUEUED", total_steps: 3};
        updateValue.mockResolvedValue(accepted as never);
        render(<MetadataList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "Edit value"}));
        await waitFor(() => expect(screen.getByText("Edit metadata value")).toBeTruthy());
        const input = screen.getByLabelText("New value") as HTMLTextAreaElement;
        await waitFor(() => expect(input.value).toBe("Jane Doe"));
        fireEvent.change(input, {target: {value: "Jane A. Doe"}});
        fireEvent.click(screen.getByRole("button", {name: "Save"}));

        await waitFor(() => expect(updateValue).toHaveBeenCalledWith({
            metadata_group: "XMP-dc", metadata_key: "Creator", metadata_value: "Jane Doe", new_value: "Jane A. Doe"
        }));
        expect(trackTask).toHaveBeenCalledWith(accepted, expect.objectContaining({onFinished: expect.any(Function)}));
        expect(message.success).toHaveBeenCalled();
    });

    it("filters by group with the Enter key, resets the filters and shows the empty row text", async () => {
        render(<MetadataList/>);
        await waitFor(() => expect(findSummaries).toHaveBeenCalledTimes(1));

        findSummaries.mockResolvedValue(page([{...creator, metadata_value: ""}]) as never);
        fireEvent.change(screen.getByLabelText("Group"), {target: {value: "XMP"}});
        fireEvent.keyDown(screen.getByLabelText("Group"), {key: "Enter", keyCode: 13});
        await waitFor(() => expect(findSummaries).toHaveBeenLastCalledWith(expect.objectContaining({metadata_group: "XMP"})));
        await waitFor(() => expect(screen.getByText("(empty)")).toBeTruthy());

        findSummaries.mockResolvedValue(page([]) as never);
        fireEvent.click(screen.getByRole("button", {name: "Reset"}));
        await waitFor(() => expect(findSummaries).toHaveBeenLastCalledWith({page: 0, size: 10, sort_by: "metadata_key", direction: "ASC"}));
        expect((screen.getByLabelText("Group") as HTMLInputElement).value).toBe("");
        await waitFor(() => expect(screen.getByText("No metadata matches the filters")).toBeTruthy());
    });

    it("closes the edit dialog without saving and reloads when the rewrite task finishes", async () => {
        updateValue.mockResolvedValue({task_id: "t-2", type: "METADATA_UPDATE_VALUE", title: "x", status: "QUEUED", total_steps: 1} as never);
        render(<MetadataList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "Edit value"}));
        await waitFor(() => expect(screen.getByText("Edit metadata value")).toBeTruthy());
        fireEvent.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(updateValue).not.toHaveBeenCalled());

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "Edit value"}));
        await waitFor(() => expect(screen.getByText("Edit metadata value")).toBeTruthy());
        fireEvent.click(screen.getByRole("button", {name: "Save"}));
        await waitFor(() => expect(trackTask).toHaveBeenCalledTimes(1));
        trackTask.mock.calls[0][1].onFinished();
        await waitFor(() => expect(findSummaries).toHaveBeenCalledTimes(2));
    });

    it("closes the file details again", async () => {
        render(<MetadataList/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));
        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByText("expand"));
        await waitFor(() => expect(screen.getByText("holiday.jpg")).toBeTruthy());
        fireEvent.click(screen.getByText("holiday.jpg"));
        await waitFor(() => expect(screen.getByText("details of holiday.jpg")).toBeTruthy());

        fireEvent.click(screen.getByRole("button", {name: "Close"}));
        await waitFor(() => expect(screen.queryByText("details of holiday.jpg")).toBeNull());
    });
});
