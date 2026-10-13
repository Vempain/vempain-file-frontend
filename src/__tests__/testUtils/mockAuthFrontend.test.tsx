/* eslint-disable @typescript-eslint/no-explicit-any */
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {act, render, screen, waitFor} from "@testing-library/react";
import {AbstractAPI, AclAPI, usePagedTable, UserAPI, VempainTable} from "@vempain/vempain-auth-frontend";

/**
 * The shared service test double (src/testUtils/mockAuthFrontend.ts) stands in for the auth-frontend package in the
 * service tests; this suite checks the double itself so that the service tests can rely on its contract.
 */
describe("mockAuthFrontend", () => {
    beforeEach(() => resetServiceMockState());

    it("records the constructor arguments and routes the CRUD methods to the shared axios mock", async () => {
        class TestAPI extends AbstractAPI<{ id: number }, { id: number }> {
            public constructor() {
                super("http://localhost:8080/api", "/things");
            }
        }

        const api = new TestAPI();
        expect(constructorSpy).toHaveBeenCalledWith("http://localhost:8080/api", "/things");

        axiosMock.get.mockResolvedValueOnce({data: [{id: 1}]});
        expect(await api.findAll({page: 1})).toEqual([{id: 1}]);
        expect(axiosMock.get).toHaveBeenLastCalledWith("", {params: {page: 1}});
        expect(axiosMock.defaults.headers.get["Content-Type"]).toBe("application/json;charset=utf-8");

        axiosMock.post.mockResolvedValueOnce({data: {content: []}});
        expect(await api.findPageable({page: 0, size: 5})).toEqual({content: []});
        expect(axiosMock.post).toHaveBeenLastCalledWith("paged", {page: 0, size: 5});

        axiosMock.get.mockResolvedValueOnce({data: {id: 2}});
        expect(await api.findById(2, null)).toEqual({id: 2});
        expect(axiosMock.get).toHaveBeenLastCalledWith("/2");

        axiosMock.get.mockResolvedValueOnce({data: {id: 3}});
        expect(await api.findById(3, "?full=true")).toEqual({id: 3});
        expect(axiosMock.get).toHaveBeenLastCalledWith("/3?full=true");

        axiosMock.post.mockResolvedValueOnce({data: {id: 4}});
        expect(await api.create({id: 4})).toEqual({id: 4});
        expect(axiosMock.post).toHaveBeenLastCalledWith("", {id: 4});

        axiosMock.put.mockResolvedValueOnce({data: {id: 5}});
        expect(await api.update({id: 5})).toEqual({id: 5});
        expect(axiosMock.put).toHaveBeenLastCalledWith("", {id: 5});

        axiosMock.delete.mockResolvedValueOnce({data: true});
        expect(await api.delete(6)).toBe(true);
        expect(axiosMock.delete).toHaveBeenLastCalledWith("/6");

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(7);
    });

    it("puts user and unit updates to the id path and reads every ACL", async () => {
        const userAPI = new UserAPI("http://localhost:8080/api", "/content-management/users") as any;
        axiosMock.put.mockResolvedValueOnce({data: {id: 9, name: "Alice"}});
        expect(await userAPI.update({id: 9, name: "Alice"})).toEqual({id: 9, name: "Alice"});
        expect(axiosMock.put).toHaveBeenLastCalledWith("/9", {id: 9, name: "Alice"});
        expect(axiosMock.defaults.headers.put["Content-Type"]).toBe("application/json;charset=utf-8");

        const aclAPI = new AclAPI("http://localhost:8080/api", "/content-management/acls") as any;
        axiosMock.get.mockResolvedValueOnce({data: [{acl_id: 1}]});
        expect(await aclAPI.getAll()).toEqual([{acl_id: 1}]);
        expect(axiosMock.get).toHaveBeenLastCalledWith("", {params: undefined});
    });

    it("provides a reduced paged table hook that fetches once, reloads on demand and tolerates failures", async () => {
        const fetcher = jest.fn();
        let state: any;

        function Screen({withOptions}: { withOptions: boolean }) {
            state = usePagedTable(fetcher, withOptions ? {defaultPageSize: 5, defaultSortBy: "name"} : undefined);
            return <div>
                <span data-testid="rows">{state.dataSource.length}</span>
                <span data-testid="loading">{String(state.loading)}</span>
                {VempainTable({paged: state} as any)}
                {state.contextHolder}
            </div>;
        }

        fetcher.mockResolvedValueOnce({content: [{id: 1}, {id: 2}]});
        const {unmount} = render(<Screen withOptions/>);
        await waitFor(() => expect(screen.getByTestId("rows").textContent).toBe("2"));
        expect(fetcher).toHaveBeenCalledWith({page: 0, size: 5, sort_by: "name", direction: "ASC"});
        expect(screen.getByTestId("loading").textContent).toBe("false");
        expect(state.pagination).toEqual({});
        expect(state.handleTableChange()).toBeUndefined();

        // A page without content empties the table
        fetcher.mockResolvedValueOnce({});
        act(() => state.reload());
        await waitFor(() => expect(screen.getByTestId("rows").textContent).toBe("0"));
        expect(fetcher).toHaveBeenCalledTimes(2);
        unmount();

        // Without options the defaults are page 0 of 10 rows, and a failed fetch only ends the loading state
        fetcher.mockRejectedValueOnce(new Error("down"));
        render(<Screen withOptions={false}/>);
        await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
        expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 10});
        expect(screen.getByTestId("rows").textContent).toBe("0");
    });
});
