/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import dayjs from "dayjs";
import {ImportFiles} from "../../../components/files/ImportFiles";
import {fileScannerAPI, pathCompletionAPI} from "../../../services";

const trackTask = jest.fn();

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string) => key})
}));

// The screen reads TaskStatusEnum through the models barrel, which re-exports it from the shared package
jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask}),
    TaskStatusEnum: {QUEUED: "QUEUED", RUNNING: "RUNNING", CANCELLING: "CANCELLING", CANCELLED: "CANCELLED", COMPLETED: "COMPLETED", FAILED: "FAILED"}
}));

jest.mock("../../../services", () => ({
    fileScannerAPI: {scanDirectory: jest.fn()},
    pathCompletionAPI: {completePath: jest.fn()}
}));

/**
 * The antd Table is replaced by a stub that renders every column of every row and offers a sort button per sortable
 * column and a filter button per filterable column, so that the comparators, renderers and filters can be asserted.
 */
jest.mock("antd", () => {
    const actual = jest.requireActual("antd") as Record<string, unknown>;
    const R = jest.requireActual("react") as typeof React;

    function StubTable({columns = [], dataSource = []}: any) {
        const [sortKey, setSortKey] = R.useState<string | null>(null);
        const [filterKey, setFilterKey] = R.useState<string | null>(null);
        let rows = [...dataSource];
        const sortColumn = columns.find((column: any) => column.key === sortKey);
        if (sortColumn) {
            rows.forEach(a => rows.forEach(b => sortColumn.sorter(a, b)));
            rows.sort(sortColumn.sorter);
        }
        const filterColumn = columns.find((column: any) => column.key === filterKey);
        if (filterColumn) {
            rows = rows.filter(row => filterColumn.onFilter(filterColumn.filters[0].value, row));
        }
        return <div data-testid="table">
            {rows.map((row: any, index: number) => <div key={row.id ?? row.file ?? index} data-testid="row">
                {columns.map((column: any) => <span key={column.key}>
                    {column.render ? column.render(row[column.dataIndex], row) : String(row[column.dataIndex] ?? "")}
                </span>)}
            </div>)}
            {columns.filter((column: any) => typeof column.sorter === "function")
                    .map((column: any) => <button key={column.key} onClick={() => setSortKey(column.key)}>sort {column.key}</button>)}
            {columns.filter((column: any) => column.onFilter)
                    .map((column: any) => <button key={column.key} onClick={() => setFilterKey(column.key)}>filter {column.key}</button>)}
        </div>;
    }

    return {...actual, Table: StubTable};
});

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

const scanDirectory = jest.mocked(fileScannerAPI.scanDirectory);
const completePath = jest.mocked(pathCompletionAPI.completePath);

function file(id: number, overrides: Record<string, unknown>) {
    return {
        id, filename: `file-${id}.jpg`, external_file_id: `ext-${id}`, mimetype: "image/jpeg", filesize: id * 1024, sha256sum: `sha-${id}`,
        original_datetime: null, description: "", file_type: "IMAGE", rights_holder: "", rights_terms: "", rights_url: "", creator_name: "",
        creator_country: "", creator_email: "", creator_url: "", tags: [], created: dayjs("2024-01-01"), modified: null, locked: false, ...overrides
    };
}

const scanResult = {
    scan_original_response: {
        success: true, error_message: null, scanned_files_count: 3, new_files_count: 2,
        successful_files: [
            file(1, {original_datetime: "2024-03-01T10:00:00", tags: ["a", "b"], locked: true, modified: dayjs("2024-02-01"), created: dayjs("2024-01-02")}),
            file(2, {
                filename: "alpha.jpg", mimetype: "image/png", file_type: "VIDEO", rights_holder: "z", rights_terms: "z", rights_url: "z",
                creator_name: "z", creator_country: "z", creator_email: "z", creator_url: "z", modified: dayjs("2024-03-01")
            }),
            file(3, {})
        ],
        failed_files: ["/broken.jpg"]
    },
    scan_export_response: {
        success: true, error_message: null, scanned_files_count: 2, new_files_count: 1,
        successful_files: [
            {
                id: 10,
                file_id: 1,
                filename: "b.jpg",
                file_path: "/export/b.jpg",
                mimetype: "image/jpeg",
                filesize: 4096,
                sha256sum: "x",
                original_document_id: null,
                created: "2024-01-03T00:00:00Z"
            },
            {
                id: 11,
                file_id: 2,
                filename: "a.jpg",
                file_path: "/export/a.jpg",
                mimetype: "image/png",
                filesize: 2048,
                sha256sum: "y",
                original_document_id: "doc",
                created: "2024-01-02T00:00:00Z"
            }
        ],
        failed_files: ["/export/broken.jpg"]
    }
};

const accepted = {task_id: "t-1", type: "SCAN_DIRECTORIES", title: "Scan", status: "QUEUED", total_steps: 2};

describe("ImportFiles", () => {
    beforeEach(() => {
        scanDirectory.mockReset();
        completePath.mockReset();
        trackTask.mockReset();
        completePath.mockResolvedValue({completions: ["/photos", "/videos"]});
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(console, "log").mockImplementation(() => undefined);
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("loads the path suggestions for both directory types when it mounts", async () => {
        render(<ImportFiles/>);

        await waitFor(() => expect(completePath).toHaveBeenCalledTimes(2));
        expect(completePath).toHaveBeenCalledWith({path: "/", type: "ORIGINAL"});
        expect(completePath).toHaveBeenCalledWith({path: "/", type: "EXPORTED"});
    });

    it("requires at least one path before a scan is started", async () => {
        render(<ImportFiles/>);
        await waitFor(() => expect(completePath).toHaveBeenCalledTimes(2));

        fireEvent.click(screen.getByRole("button", {name: "ImportFiles.form.submit.startScan"}));

        await waitFor(() => expect(screen.getAllByText("ImportFiles.form.validation.atLeastOnePath").length).toBeGreaterThan(0));
        expect(scanDirectory).not.toHaveBeenCalled();
    });

    it("completes paths while typing and selecting, and tolerates completion failures", async () => {
        render(<ImportFiles/>);
        await waitFor(() => expect(completePath).toHaveBeenCalledTimes(2));

        const [original, exported] = screen.getAllByRole("combobox");
        fireEvent.change(original, {target: {value: "/pho"}});
        await waitFor(() => expect(completePath).toHaveBeenCalledWith({path: "/pho", type: "ORIGINAL"}));
        fireEvent.click(await screen.findByText("/photos", {selector: ".ant-select-item-option-content"}));
        await waitFor(() => expect(completePath).toHaveBeenCalledWith({path: "/photos", type: "ORIGINAL"}));

        completePath.mockRejectedValueOnce(new Error("down"));
        fireEvent.change(exported, {target: {value: "/vid"}});
        await waitFor(() => expect(completePath).toHaveBeenCalledWith({path: "/vid", type: "EXPORTED"}));
        completePath.mockResolvedValueOnce({completions: ["/videos/2024"]});
        fireEvent.change(exported, {target: {value: "/videos"}});
        fireEvent.click(await screen.findByText("/videos/2024", {selector: ".ant-select-item-option-content"}));
        await waitFor(() => expect(completePath).toHaveBeenCalledWith({path: "/videos/2024", type: "EXPORTED"}));
        expect(completePath).toHaveBeenCalledWith({path: "/videos", type: "EXPORTED"});
    });

    it("starts the scan as a background task and renders the result tables when it finishes", async () => {
        scanDirectory.mockResolvedValue(accepted as never);
        render(<ImportFiles/>);
        await waitFor(() => expect(completePath).toHaveBeenCalledTimes(2));

        fireEvent.change(screen.getAllByRole("combobox")[0], {target: {value: "/photos"}});
        fireEvent.click(screen.getByRole("button", {name: "ImportFiles.form.submit.startScan"}));

        await waitFor(() => expect(scanDirectory).toHaveBeenCalledWith(expect.objectContaining({original_directory: "/photos"})));
        expect(trackTask).toHaveBeenCalledWith(accepted, expect.objectContaining({onFinished: expect.any(Function)}));
        expect(message.success).toHaveBeenCalledWith("ImportFiles.messages.scanStarted");

        // A failed task leaves the screen without results
        const {onFinished} = trackTask.mock.calls[0][1];
        act(() => onFinished({status: "FAILED", result: null}));
        expect(screen.queryByText("ImportFiles.results.original.title")).toBeNull();

        act(() => onFinished({status: "COMPLETED", result: scanResult}));
        expect(screen.getByText("ImportFiles.results.original.title")).toBeTruthy();
        expect(screen.getByText("ImportFiles.results.export.title")).toBeTruthy();
        const tables = screen.getAllByTestId("table");
        expect(tables).toHaveLength(4);

        // Failed files (one row per failed path), original files and export files
        expect(within(tables[0]).getAllByTestId("row")).toHaveLength(1);
        expect(within(tables[1]).getAllByTestId("row")).toHaveLength(3);
        expect(within(tables[1]).getByText("a, b")).toBeTruthy();
        expect(within(tables[1]).getByText("2024-03-01 10:00:00")).toBeTruthy();
        expect(within(tables[1]).getAllByText("Common.general.no")).toHaveLength(2);
        expect(within(tables[1]).getByText("1.00 KB")).toBeTruthy();
        expect(within(tables[2]).getAllByTestId("row")).toHaveLength(1);
        expect(within(tables[3]).getAllByTestId("row")).toHaveLength(2);
        expect(within(tables[3]).getByText("4.00 KB")).toBeTruthy();

        // Every column comparator and filter works on the result rows
        for (const button of screen.getAllByRole("button", {name: /^sort /})) {
            fireEvent.click(button);
        }
        expect(within(screen.getAllByTestId("table")[1]).getAllByTestId("row")).toHaveLength(3);
        fireEvent.click(screen.getByRole("button", {name: "filter locked"}));
        expect(within(screen.getAllByTestId("table")[1]).getAllByTestId("row")).toHaveLength(1);
    });

    it("renders only the headers when a scan found nothing", async () => {
        scanDirectory.mockResolvedValue(accepted as never);
        render(<ImportFiles/>);
        await waitFor(() => expect(completePath).toHaveBeenCalledTimes(2));

        fireEvent.change(screen.getAllByRole("combobox")[1], {target: {value: "/export"}});
        fireEvent.click(screen.getByRole("button", {name: "ImportFiles.form.submit.startScan"}));
        await waitFor(() => expect(trackTask).toHaveBeenCalled());

        act(() => trackTask.mock.calls[0][1].onFinished({
            status: "COMPLETED",
            result: {
                scan_original_response: {
                    success: true,
                    error_message: null,
                    scanned_files_count: 0,
                    new_files_count: 0,
                    successful_files: [],
                    failed_files: []
                },
                scan_export_response: null
            }
        }));
        expect(screen.getByText("ImportFiles.results.original.title")).toBeTruthy();
        expect(screen.queryAllByTestId("table")).toHaveLength(0);
    });

    it("reports a scan that could not be started", async () => {
        scanDirectory.mockRejectedValue(new Error("busy"));
        render(<ImportFiles/>);
        await waitFor(() => expect(completePath).toHaveBeenCalledTimes(2));

        fireEvent.change(screen.getAllByRole("combobox")[0], {target: {value: "/photos"}});
        fireEvent.click(screen.getByRole("button", {name: "ImportFiles.form.submit.startScan"}));

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("ImportFiles.messages.scanError"));
        expect(trackTask).not.toHaveBeenCalled();
    });
});
