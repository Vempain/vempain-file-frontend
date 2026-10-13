/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MetadataFiles} from "../../../components/metadata/MetadataFiles";
import {metadataAPI} from "../../../services";
import type {FileResponse, MetadataSummaryResponse} from "../../../models";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string, options?: Record<string, unknown>) => (options?.defaultValue as string | undefined) ?? key})
}));

jest.mock("../../../services", () => ({
    metadataAPI: {findFiles: jest.fn()}
}));

jest.mock("../../../tools", () => ({
    fileTypeEnum2Tag: (value: string) => <span>type:{value}</span>,
    formatByteSize: (value: number) => `${value} B`
}));

/** Reduced `usePagedTable`/`VempainTable`: the hook refetches when the `deps` change; the table renders every column. */
jest.mock("@vempain/vempain-auth-frontend", () => {
    const R = jest.requireActual("react") as typeof React;

    function usePagedTable(fetcher: (request: any) => Promise<any>, options: any = {}) {
        const [dataSource, setDataSource] = R.useState<any[]>([]);
        const [loading, setLoading] = R.useState(true);
        const fetcherRef = R.useRef(fetcher);
        fetcherRef.current = fetcher;
        const depsKey = JSON.stringify(options.deps ?? []);
        R.useEffect(() => {
            setLoading(true);
            fetcherRef.current({page: 0, size: options.defaultPageSize, sort_by: options.defaultSortBy, direction: "ASC"})
                    .then((response: any) => {
                        setDataSource(response?.content ?? []);
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
        }, [depsKey, options.defaultPageSize, options.defaultSortBy]);
        return {
            dataSource,
            loading,
            pagination: {showSizeChanger: true},
            handleTableChange: () => undefined,
            setFilter: jest.fn(),
            reload: jest.fn(),
            contextHolder: null
        };
    }

    function VempainTable({paged, columns = [], rowKey}: any) {
        return <div data-testid="table" data-page-size={paged.pagination.pageSize} data-size-changer={String(paged.pagination.showSizeChanger)}>
            {paged.dataSource.map((row: any) => <div key={row[rowKey]} data-testid="row">
                {columns.map((column: any) => <span key={column.key}>
                    {column.render ? column.render(row[column.dataIndex], row) : String(row[column.dataIndex] ?? "")}
                </span>)}
            </div>)}
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

const findFiles = jest.mocked(metadataAPI.findFiles);
const summary: MetadataSummaryResponse = {metadata_group: "XMP-dc", metadata_key: "Creator", metadata_value: "Jane", file_count: 2, writable: true};
const files = [
    {id: 1, filename: "a.jpg", file_path: "/a", file_type: "IMAGE", filesize: 10},
    {id: 2, filename: "b.bin", file_path: "/b", file_type: null, filesize: 20}
] as unknown as FileResponse[];

function page(content: unknown[]) {
    return {content, page: 0, size: 10, total_elements: content.length, total_pages: 1, first: true, last: true, empty: content.length === 0};
}

describe("MetadataFiles", () => {
    beforeEach(() => {
        findFiles.mockReset();
        findFiles.mockResolvedValue(page(files) as never);
    });

    it("lists the files of the row ten at a time with a fixed page size and opens a file", async () => {
        const onOpenFile = jest.fn();
        render(<MetadataFiles summary={summary} onOpenFile={onOpenFile}/>);

        await waitFor(() => expect(findFiles).toHaveBeenCalledWith({
            metadata_group: "XMP-dc", metadata_key: "Creator", metadata_value: "Jane", page: 0, size: 10, sort_by: "filename", direction: "ASC"
        }));
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));
        expect(screen.getByTestId("table").getAttribute("data-page-size")).toBe("10");
        expect(screen.getByTestId("table").getAttribute("data-size-changer")).toBe("false");
        expect(screen.getByText("type:IMAGE")).toBeTruthy();
        // A file without a type is shown as unknown
        expect(screen.getByText("type:UNKNOWN")).toBeTruthy();
        expect(screen.getByText("20 B")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", {name: "b.bin"}));
        expect(onOpenFile).toHaveBeenCalledWith(files[1]);
    });

    it("filters by file name with the Enter key and by type through the select", async () => {
        render(<MetadataFiles summary={summary} onOpenFile={jest.fn()}/>);
        await waitFor(() => expect(findFiles).toHaveBeenCalledTimes(1));

        fireEvent.change(screen.getByLabelText("Filter by file name"), {target: {value: " a "}});
        fireEvent.keyDown(screen.getByLabelText("Filter by file name"), {key: "Enter", keyCode: 13});
        await waitFor(() => expect(findFiles).toHaveBeenLastCalledWith(expect.objectContaining({filename: "a"})));

        fireEvent.mouseDown(screen.getByRole("combobox"));
        fireEvent.click(await screen.findByText("AUDIO", {selector: ".ant-select-item-option-content"}));
        await waitFor(() => expect(findFiles).toHaveBeenLastCalledWith(expect.objectContaining({filename: "a", file_type: "AUDIO"})));
    });

    it("shows a tag when no readable file carries the value", async () => {
        findFiles.mockResolvedValue(page([]) as never);
        render(<MetadataFiles summary={summary} onOpenFile={jest.fn()}/>);

        await waitFor(() => expect(screen.getByText("No readable files carry this value")).toBeTruthy());
        expect(screen.queryByTestId("table")).toBeNull();
    });
});
