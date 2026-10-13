/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {TaggedFiles} from "../../../components/tags/TaggedFiles";
import {tagAPI} from "../../../services";

let routeParams: Record<string, string | undefined> = {tagId: "4"};
const navigate = jest.fn();

jest.mock("react-router-dom", () => ({
    useParams: () => routeParams,
    useNavigate: () => navigate
}));

// A stable translation function: the screen memoizes its columns on `t`
const translate = (key: string, options?: { tag?: string }) => options?.tag === undefined ? key : `${key} ${options.tag}`;
jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: translate})
}));

jest.mock("../../../services", () => ({
    tagAPI: {findFilesPageable: jest.fn(), findById: jest.fn()}
}));

/** The mocked filter dropdown callbacks, so that the column search props can be asserted */
const filterProps = {setSelectedKeys: jest.fn(), confirm: jest.fn(), clearFilters: jest.fn(), close: jest.fn()};

/**
 * Reduced `usePagedTable`/`VempainTable`: the hook honours `enabled` and `deps`; the table renders every column of every
 * row and, for searchable columns, the column's filter dropdown, filter icon and open handler.
 */
jest.mock("@vempain/vempain-auth-frontend", () => {
    const R = jest.requireActual("react") as typeof React;

    function usePagedTable(fetcher: (request: any) => Promise<any>, options: any = {}) {
        const [dataSource, setDataSource] = R.useState<any[]>([]);
        const [loading, setLoading] = R.useState(options.enabled !== false);
        const fetcherRef = R.useRef(fetcher);
        fetcherRef.current = fetcher;
        const depsKey = JSON.stringify(options.deps ?? []);
        R.useEffect(() => {
            if (options.enabled === false) return;
            setLoading(true);
            fetcherRef.current({
                page: 0,
                size: options.defaultPageSize ?? 10,
                sort_by: options.defaultSortBy,
                direction: options.defaultSortBy ? "ASC" : undefined
            })
                    .then((response: any) => {
                        setDataSource(response?.content ?? []);
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
        }, [depsKey, options.enabled, options.defaultPageSize, options.defaultSortBy]);
        return {dataSource, loading, pagination: {}, handleTableChange: () => undefined, reload: () => undefined, contextHolder: null};
    }

    function VempainTable({paged, columns = [], rowKey}: any) {
        return <div data-testid="table">
            {paged.dataSource.map((row: any) => <div key={row[rowKey]} data-testid="row">
                {columns.map((column: any) => <span key={column.key}>
                    {column.render ? column.render(row[column.dataIndex], row) : String(row[column.dataIndex] ?? "")}
                </span>)}
            </div>)}
            {columns.filter((column: any) => column.filterDropdown).map((column: any) => <div key={column.key} data-testid={`filter-${column.key}`}>
                {column.filterDropdown({...filterProps, selectedKeys: [], visible: true, prefixCls: "x"})}
                {column.filterIcon(true)}
                <button onClick={() => column.filterDropdownProps.onOpenChange(true)}>open {column.key}</button>
            </div>)}
        </div>;
    }

    return {usePagedTable, VempainTable};
}, {virtual: true});

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn()})
});

const findFilesPageable = jest.mocked(tagAPI.findFilesPageable);
const findById = jest.mocked(tagAPI.findById);

const files = [
    {id: 1, filename: "a.jpg", file_path: "/a", mimetype: "image/jpeg", filesize: 1024, file_type: "IMAGE", created: "2024-01-01T00:00:00Z"},
    {id: 2, filename: "b.jpg", file_path: "/b", mimetype: "image/jpeg", filesize: 2048, file_type: "IMAGE", created: null}
];

function page(content: unknown[]) {
    return {content, page: 0, size: 10, total_elements: content.length, total_pages: 1, first: true, last: true, empty: content.length === 0};
}

describe("TaggedFiles", () => {
    beforeEach(() => {
        routeParams = {tagId: "4"};
        navigate.mockReset();
        findFilesPageable.mockReset();
        findById.mockReset();
        Object.values(filterProps).forEach(mock => mock.mockReset());
        findFilesPageable.mockResolvedValue(page(files) as never);
        findById.mockResolvedValue({id: 4, tag_name: "nature"} as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
    });

    afterEach(() => jest.restoreAllMocks());

    it("loads the files of the tag sorted by file name and shows the tag name in the title", async () => {
        render(<TaggedFiles/>);

        await waitFor(() => expect(findFilesPageable).toHaveBeenCalledWith(4, {page: 0, size: 10, sort_by: "filename", direction: "ASC"}));
        expect(findById).toHaveBeenCalledWith(4, null);
        await waitFor(() => expect(screen.getByText("TaggedFiles.title nature")).toBeTruthy());
        expect(screen.getAllByTestId("row")).toHaveLength(2);
        expect(screen.getByText("1.00 kB")).toBeTruthy();
        expect(screen.getByText("2.00 kB")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", {name: /TaggedFiles.actions.back/}));
        expect(navigate).toHaveBeenCalledWith("/tags/list");
    });

    it("wires the column search dropdowns to the table filter callbacks", async () => {
        render(<TaggedFiles/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(2));

        const filter = screen.getByTestId("filter-filename");
        const input = within(filter).getByRole("textbox");
        fireEvent.change(input, {target: {value: "holi"}});
        expect(filterProps.setSelectedKeys).toHaveBeenLastCalledWith(["holi"]);
        fireEvent.change(input, {target: {value: ""}});
        expect(filterProps.setSelectedKeys).toHaveBeenLastCalledWith([]);
        fireEvent.keyDown(input, {key: "Enter", keyCode: 13});
        expect(filterProps.confirm).toHaveBeenCalledTimes(1);
        fireEvent.click(within(filter).getByRole("button", {name: /Common.search/}));
        expect(filterProps.confirm).toHaveBeenCalledTimes(2);
        fireEvent.click(within(filter).getByRole("button", {name: "Common.reset"}));
        expect(filterProps.clearFilters).toHaveBeenCalledTimes(1);
        expect(filterProps.confirm).toHaveBeenCalledTimes(3);
        expect(filterProps.close).toHaveBeenCalledTimes(1);

        // Opening the dropdown focuses the search input shortly afterwards
        const select = jest.spyOn(HTMLInputElement.prototype, "select").mockImplementation(() => undefined);
        fireEvent.click(within(screen.getByTestId("filter-file_path")).getByRole("button", {name: "open file_path"}));
        await waitFor(() => expect(select).toHaveBeenCalled());
        expect(screen.getAllByTestId(/^filter-/)).toHaveLength(3);
    });

    it("shows the empty message and falls back to the tag id when the tag cannot be loaded", async () => {
        findFilesPageable.mockResolvedValue(page([]) as never);
        findById.mockRejectedValue(new Error("gone"));
        render(<TaggedFiles/>);

        await waitFor(() => expect(screen.getByText("TaggedFiles.messages.noFiles")).toBeTruthy());
        expect(screen.getByText("TaggedFiles.title 4")).toBeTruthy();
        expect(message.error).not.toHaveBeenCalled();
    });

    it("rejects an invalid tag id without fetching anything", async () => {
        routeParams = {tagId: "abc"};
        render(<TaggedFiles/>);

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("TaggedFiles.messages.invalidTag"));
        expect(findFilesPageable).not.toHaveBeenCalled();
        expect(findById).not.toHaveBeenCalled();
        expect(screen.getByText("TaggedFiles.messages.noFiles")).toBeTruthy();
    });
});
