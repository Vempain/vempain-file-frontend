/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import * as services from "../../../services";
import {ArchiveFiles} from "../../../components/files/ArchiveFiles";
import {AudioFiles} from "../../../components/files/AudioFiles";
import {BinaryFiles} from "../../../components/files/BinaryFiles";
import {DataFiles} from "../../../components/files/DataFiles";
import {DocumentFiles} from "../../../components/files/DocumentFiles";
import {ExecutableFiles} from "../../../components/files/ExecutableFiles";
import {FontFiles} from "../../../components/files/FontFiles";
import {IconFiles} from "../../../components/files/IconFiles";
import {ImageFiles} from "../../../components/files/ImageFiles";
import {InteractiveFiles} from "../../../components/files/InteractiveFiles";
import {MusicFiles} from "../../../components/files/MusicFiles";
import {ThumbFiles} from "../../../components/files/ThumbFiles";
import {VectorFiles} from "../../../components/files/VectorFiles";
import {VideoFiles} from "../../../components/files/VideoFiles";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string) => key})
}));

jest.mock("../../../services", () => {
    const api = () => ({findAllPageable: jest.fn(), delete: jest.fn()});
    return {
        archiveFileAPI: api(),
        audioFileAPI: api(),
        binaryFileAPI: api(),
        dataFileAPI: api(),
        documentFileAPI: api(),
        executableFileAPI: api(),
        fontFileAPI: api(),
        iconFileAPI: api(),
        imageFileAPI: api(),
        interactiveFileAPI: api(),
        musicFileAPI: api(),
        thumbFileAPI: api(),
        vectorFileAPI: api(),
        videoFileAPI: api()
    };
});

jest.mock("../../../components/files/FileDetails", () => ({
    FileDetails: ({file}: { file: { filename: string } }) => <div>details of {file.filename}</div>
}));

jest.mock("../../../components/files/PublishFileButton", () => ({
    PublishFileButton: ({file, onPublished}: { file: { filename: string }; onPublished: () => void }) =>
            <button onClick={onPublished}>publish {file.filename}</button>
}));

/**
 * Reduced `usePagedTable`/`VempainTable`: the hook fetches the first page and reloads on demand; the table renders every
 * column of every row and offers a sort button per sortable column so that the column comparators can be exercised.
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
            fetcherRef.current({page: 0, size: options.defaultPageSize ?? 10})
                    .then((response: any) => {
                        setDataSource(response?.content ?? []);
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
        }, [options.defaultPageSize, reloadCounter]);
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
        const [sortKey, setSortKey] = R.useState<string | null>(null);
        const sorter = columns.find((column: any) => column.key === sortKey)?.sorter;
        const rows = sorter ? [...paged.dataSource].sort(sorter) : paged.dataSource;
        return <div data-testid="table">
            {rows.map((row: any) => <div key={row[rowKey]} data-testid="row">
                {columns.map((column: any) => <span key={column.key}>
                    {column.render ? column.render(row[column.dataIndex], row) : String(row[column.dataIndex] ?? "")}
                </span>)}
            </div>)}
            {columns.filter((column: any) => typeof column.sorter === "function")
                    .map((column: any) => <button key={column.key} onClick={() => setSortKey(column.key)}>sort {column.key}</button>)}
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

type MockApi = { findAllPageable: jest.Mock; delete: jest.Mock };

interface ListCase {
    name: string;
    Component: () => React.JSX.Element;
    api: MockApi;
    extras: [Record<string, unknown>, Record<string, unknown>];
    /** Texts that only the type-specific columns of the first row render */
    expectedTexts: string[];
}

function baseRow(index: number) {
    return {
        id: index,
        external_file_id: `ext-${index}`,
        filename: index === 1 ? "beta.bin" : "alpha.bin",
        file_path: `/files/${index}`,
        filesize: index * 2048,
        mimetype: index === 1 ? "application/zip" : "application/octet-stream",
        thumbnail_id: null,
        created: index === 1 ? "2024-02-01T00:00:00Z" : null
    };
}

function page(rows: unknown[]) {
    return {content: rows, page: 0, size: 10, total_elements: rows.length, total_pages: 1, first: true, last: true, empty: rows.length === 0};
}

const cases: ListCase[] = [
    {
        name: "ArchiveFiles", Component: ArchiveFiles, api: services.archiveFileAPI as unknown as MockApi,
        extras: [{compression_method: "deflate", uncompressed_size: 4096, content_count: 3, is_encrypted: true}, {
            compression_method: "store",
            uncompressed_size: 0,
            content_count: 0,
            is_encrypted: false
        }],
        expectedTexts: ["deflate", "4.00 KB", "Common.general.yes", "Common.general.no"]
    },
    {
        name: "AudioFiles", Component: AudioFiles, api: services.audioFileAPI as unknown as MockApi,
        extras: [{duration: 12, bit_rate: 128, sample_rate: 44100, codec: "mp3", channels: 2}, {
            duration: 3,
            bit_rate: 64,
            sample_rate: 22050,
            codec: "aac",
            channels: 1
        }],
        expectedTexts: ["12s", "44100", "mp3"]
    },
    {
        name: "BinaryFiles", Component: BinaryFiles, api: services.binaryFileAPI as unknown as MockApi,
        extras: [{software_name: "gimp", software_major_version: 2}, {software_name: "blender", software_major_version: 4}],
        expectedTexts: ["gimp", "blender"]
    },
    {
        name: "DataFiles", Component: DataFiles, api: services.dataFileAPI as unknown as MockApi,
        extras: [{data_structure: "csv"}, {data_structure: "json"}],
        expectedTexts: ["csv", "json"]
    },
    {
        name: "DocumentFiles", Component: DocumentFiles, api: services.documentFileAPI as unknown as MockApi,
        extras: [{page_count: 12, format: "pdf"}, {page_count: 1, format: "odt"}],
        expectedTexts: ["pdf", "odt"]
    },
    {
        name: "ExecutableFiles", Component: ExecutableFiles, api: services.executableFileAPI as unknown as MockApi,
        extras: [{operating_systems: ["linux", "bsd"], script: true}, {operating_systems: null, script: false}],
        expectedTexts: ["linux, bsd", "Common.general.yes", "Common.general.no"]
    },
    {
        name: "FontFiles", Component: FontFiles, api: services.fontFileAPI as unknown as MockApi,
        extras: [{font_family: "Inter", weight: 400, style: "normal"}, {font_family: "Fira", weight: 700, style: "italic"}],
        expectedTexts: ["Inter", "italic"]
    },
    {
        name: "IconFiles", Component: IconFiles, api: services.iconFileAPI as unknown as MockApi,
        extras: [{width: 16, height: 16, is_scalable: true}, {width: 32, height: 32, is_scalable: false}],
        expectedTexts: ["Common.general.yes", "Common.general.no"]
    },
    {
        name: "ImageFiles", Component: ImageFiles, api: services.imageFileAPI as unknown as MockApi,
        extras: [{width: 800, height: 600, dpi: 72, color_depth: 24, group_label: "holiday"}, {
            width: 400,
            height: 300,
            dpi: 96,
            color_depth: 8,
            group_label: "work"
        }],
        expectedTexts: ["holiday", "CommonColumns.columns.thumb.no_thumb"]
    },
    {
        name: "InteractiveFiles", Component: InteractiveFiles, api: services.interactiveFileAPI as unknown as MockApi,
        extras: [{technology: "html5"}, {technology: "flash"}],
        expectedTexts: ["html5", "flash"]
    },
    {
        name: "MusicFiles", Component: MusicFiles, api: services.musicFileAPI as unknown as MockApi,
        extras: [{duration: 240, bit_rate: 320, codec: "flac", artist: "Band", album: "Album", track_name: "Track", genre: "Jazz"}, {
            duration: 10,
            bit_rate: 1,
            codec: "ogg",
            artist: "B",
            album: "A",
            track_name: "T",
            genre: "Rock"
        }],
        expectedTexts: ["240s", "Band", "Jazz"]
    },
    {
        name: "ThumbFiles", Component: ThumbFiles, api: services.thumbFileAPI as unknown as MockApi,
        extras: [{relation_type: "THUMBNAIL", target_file_id: 77}, {relation_type: "PREVIEW", target_file_id: 78}],
        expectedTexts: ["THUMBNAIL", "77"]
    },
    {
        name: "VectorFiles", Component: VectorFiles, api: services.vectorFileAPI as unknown as MockApi,
        extras: [{width: 100, height: 50, layers_count: 4}, {width: 10, height: 5, layers_count: 1}],
        expectedTexts: ["100", "4"]
    },
    {
        name: "VideoFiles", Component: VideoFiles, api: services.videoFileAPI as unknown as MockApi,
        extras: [{width: 1920, height: 1080, frame_rate: 30, duration: 90, codec: "h264"}, {
            width: 640,
            height: 480,
            frame_rate: 24,
            duration: 5,
            codec: "vp9"
        }],
        expectedTexts: ["90s", "h264", "1920"]
    }
];

describe.each(cases)("$name", ({name, Component, api, extras, expectedTexts}) => {
    const rows = [{...baseRow(1), ...extras[0]}, {...baseRow(2), ...extras[1]}];

    beforeEach(() => {
        api.findAllPageable.mockReset();
        api.delete.mockReset();
        api.findAllPageable.mockResolvedValue(page(rows));
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it("loads the first page, renders the type-specific columns and sorts through the column comparators", async () => {
        render(<Component/>);

        await waitFor(() => expect(api.findAllPageable).toHaveBeenCalledWith({page: 0, size: 10}));
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));
        for (const text of expectedTexts) {
            expect(screen.getAllByText(text).length).toBeGreaterThan(0);
        }
        expect(screen.getAllByText("2.00 kB").length).toBe(1);

        // Every sortable column orders the two rows without failing; the file name sorter puts alpha before beta
        for (const button of screen.getAllByRole("button", {name: /^sort /})) {
            fireEvent.click(button);
            expect(screen.getAllByTestId("row")).toHaveLength(2);
        }
        fireEvent.click(screen.getByRole("button", {name: "sort filename"}));
        const sorted = screen.getAllByTestId("row");
        expect(within(sorted[0]).getByText("alpha.bin")).toBeTruthy();
        expect(within(sorted[1]).getByText("beta.bin")).toBeTruthy();
    });

    it("shows the empty message when the page has no rows", async () => {
        api.findAllPageable.mockResolvedValue(page([]));
        render(<Component/>);

        await waitFor(() => expect(screen.getByText(`${name}.messages.noFiles`)).toBeTruthy());
        expect(screen.queryByTestId("table")).toBeNull();
    });

    it("opens the file details from the file name and reloads after a publish", async () => {
        render(<Component/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(screen.getByRole("button", {name: "beta.bin"}));
        await waitFor(() => expect(screen.getByText("details of beta.bin")).toBeTruthy());
        fireEvent.click(screen.getByRole("button", {name: "Close"}));
        await waitFor(() => expect(screen.queryByText("details of beta.bin")).toBeNull());

        fireEvent.click(screen.getByRole("button", {name: "publish beta.bin"}));
        await waitFor(() => expect(api.findAllPageable).toHaveBeenCalledTimes(2));
    });

    it("deletes a file after confirmation and reports failures", async () => {
        api.delete.mockResolvedValueOnce(true);
        render(<Component/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: /delete/}));
        fireEvent.click(await screen.findByText("Common.popconfirm.yes"));

        await waitFor(() => expect(api.delete).toHaveBeenCalledWith(1));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith(`${name}.messages.deleteSuccess`));
        await waitFor(() => expect(api.findAllPageable).toHaveBeenCalledTimes(2));

        api.delete.mockRejectedValueOnce(new Error("locked"));
        fireEvent.click(within(screen.getAllByTestId("row")[1]).getByRole("button", {name: /delete/}));
        fireEvent.click((await screen.findAllByText("Common.popconfirm.yes")).at(-1)!);

        await waitFor(() => expect(api.delete).toHaveBeenCalledWith(2));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith(`${name}.messages.deleteError`));
        expect(api.findAllPageable).toHaveBeenCalledTimes(2);
    });
});
