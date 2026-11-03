/* eslint-disable @typescript-eslint/no-explicit-any */
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type React from "react";
import {DataSets} from "../../../components/data/DataSets";
import {dataAPI} from "../../../services";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key})
}));

jest.mock("../../../services", () => ({
    dataAPI: {findPageableDataSets: jest.fn()}
}));

/**
 * Reduced `usePagedTable`/`VempainTable` of the auth library (the package ships an ESM build the test runtime cannot load): the hook
 * fetches the first page with the defaults and again when a dep changes, the table renders every column of every row.
 */
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
            fetcherRef.current({page: 0, size: options.defaultPageSize ?? 10, sort_by: options.defaultSortBy, direction: options.defaultDirection})
                    .then((response: any) => {
                        setDataSource(response?.content ?? []);
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
        }, [depsKey, options.defaultPageSize, options.defaultSortBy, options.defaultDirection]);
        return {dataSource, loading, pagination: {}, handleTableChange: () => undefined, reload: () => undefined, contextHolder: null};
    }

    function VempainTable({paged, columns = [], rowKey}: any) {
        return <div data-testid="table">
            <div data-testid="headers">{columns.map((column: any) => <span key={column.key} data-sorter={String(column.sorter === true)}
                                                                            data-searchable={String(column.searchable !== false)}>{column.title}</span>)}</div>
            {paged.dataSource.map((row: any) => {
                const key = typeof rowKey === "function" ? rowKey(row) : row[rowKey];
                return <div key={key} data-testid="row">
                    {columns.map((column: any) => <span key={column.key}>
                        {column.render ? column.render(row[column.dataIndex], row) : String(row[column.dataIndex] ?? "")}
                    </span>)}
                </div>;
            })}
        </div>;
    }

    return {usePagedTable, VempainTable};
}, {virtual: true});

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn()})
});

const findPageableDataSets = jest.mocked(dataAPI.findPageableDataSets);

const music = {
    id: 1, acl_id: 41, creator: 1, created: "2026-01-02T10:00:00Z", modifier: null, modified: null,
    identifier: "music_library", type: "tabulated", description: "Music library", generated: "2026-01-01T10:00:00Z", published: "2026-01-05T08:00:00Z"
};
const trip = {
    ...music, id: 2, acl_id: 42, identifier: "gps_timeseries_trip", type: "time_series", description: null, modifier: 1, modified: "2026-01-06T08:00:00Z",
    published: null
};

function page(content: unknown[]) {
    return {content, page: 0, size: 25, total_elements: content.length, total_pages: 1, first: true, last: true, empty: content.length === 0};
}

describe("DataSets", () => {
    beforeEach(() => {
        findPageableDataSets.mockReset();
        findPageableDataSets.mockResolvedValue(page([music, trip]) as never);
    });

    it("asks the file backend for the first page sorted by identifier and lists the data sets", async () => {
        render(<DataSets/>);

        await waitFor(() => expect(findPageableDataSets).toHaveBeenCalledWith({
            page: 0, size: 25, sort_by: "identifier", direction: "ASC", modified_after_publish: false
        }));
        expect(await screen.findByText("music_library")).toBeTruthy();
        expect(screen.getByText("gps_timeseries_trip")).toBeTruthy();
        expect(screen.getByText("Data sets")).toBeTruthy();

        // every column sorts on the backend; identifier, type and description carry the column search, the timestamps do not
        const headers = Array.from(screen.getByTestId("headers").children) as HTMLElement[];
        expect(headers.map(header => header.textContent)).toEqual(["Identifier", "Type", "Description", "Generated", "Created", "Modified", "Released"]);
        expect(headers.every(header => header.dataset.sorter === "true")).toBe(true);
        expect(headers.map(header => header.dataset.searchable)).toEqual(["true", "true", "true", "false", "false", "false", "false"]);

        const rows = screen.getAllByTestId("row");
        expect(rows[0].textContent).toContain("tabulated");
        expect(rows[0].textContent).toContain("Music library");
        expect(rows[1].textContent).toContain("-");
        expect(rows[1].textContent).toContain("Not released");
        expect(rows[0].textContent).not.toContain("Not released");
    });

    it("sends the release filter to the backend when the switch is toggled", async () => {
        render(<DataSets/>);
        await screen.findByText("music_library");

        fireEvent.click(screen.getByRole("switch", {name: "Only modified after publish"}));

        await waitFor(() => expect(findPageableDataSets).toHaveBeenLastCalledWith(expect.objectContaining({modified_after_publish: true})));
        fireEvent.click(screen.getByRole("switch", {name: "Only modified after publish"}));
        await waitFor(() => expect(findPageableDataSets).toHaveBeenLastCalledWith(expect.objectContaining({modified_after_publish: false})));
    });
});
