/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {message} from "antd";
import {LocationGuards} from "../../../components/management/LocationGuards";
import {locationAPI} from "../../../services";
import {GuardTypeEnum} from "../../../models";

// A stable translation function: the screen memoizes its fetcher on `t`
const translate = (key: string) => key;
jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: translate})
}));

jest.mock("@vempain/vempain-auth-frontend", () => ({
    AbstractAPI: class {
    }
}), {virtual: true});

jest.mock("../../../services", () => ({
    locationAPI: {findAllLocationGuards: jest.fn(), deleteLocationGuard: jest.fn(), addLocationGuard: jest.fn(), updateLocationGuard: jest.fn()},
    LocationAPI: jest.requireActual("../../../services/LocationAPI").LocationAPI
}));

const mockMap = {invalidateSize: jest.fn(), setView: jest.fn()};
let mapEventHandlers: { click?: (event: { latlng: { lat: number; lng: number } }) => void } = {};

jest.mock("react-leaflet", () => ({
    MapContainer: ({children, center, zoom}: { children: React.ReactNode; center: [number, number]; zoom: number }) =>
            <div data-testid="map" data-center={center.join(",")} data-zoom={zoom}>{children}</div>,
    TileLayer: () => null,
    CircleMarker: ({center}: { center: [number, number] }) => <div data-testid="marker" data-center={center.join(",")}/>,
    useMap: () => mockMap,
    useMapEvents: (handlers: typeof mapEventHandlers) => {
        mapEventHandlers = handlers;
        return mockMap;
    }
}));

/**
 * The antd Table is replaced by a stub that renders every column of every row and offers a sort button per sortable
 * column and a filter button per filterable column, so that the comparators and filters can be asserted directly.
 */
jest.mock("antd", () => {
    const actual = jest.requireActual("antd") as Record<string, unknown>;
    const R = jest.requireActual("react") as typeof React;

    function StubTable({columns = [], dataSource = [], rowKey}: any) {
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
            {rows.map((row: any) => <div key={typeof rowKey === "function" ? rowKey(row) : row[rowKey]} data-testid="row">
                {columns.map((column: any) => <span key={column.key}>
                    {column.render ? column.render(column.dataIndex ? row[column.dataIndex] : undefined, row) : String(row[column.dataIndex] ?? "")}
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

const findAllLocationGuards = jest.mocked(locationAPI.findAllLocationGuards);
const deleteLocationGuard = jest.mocked(locationAPI.deleteLocationGuard);
const addLocationGuard = jest.mocked(locationAPI.addLocationGuard);
const updateLocationGuard = jest.mocked(locationAPI.updateLocationGuard);

const circle = {
    id: 2,
    guard_type: GuardTypeEnum.CIRCLE,
    primary_coordinate: {latitude: 60.16992, longitude: 24.93838},
    secondary_coordinate: null,
    radius: 250
};
const square = {
    id: 1, guard_type: GuardTypeEnum.SQUARE, primary_coordinate: {latitude: 60.1, longitude: 24.9},
    secondary_coordinate: {latitude: 60.2, longitude: 25}, radius: null
};
const broken = {id: 3, guard_type: GuardTypeEnum.CIRCLE, primary_coordinate: {latitude: "x", longitude: 1}, secondary_coordinate: undefined, radius: undefined};

function modal() {
    return document.querySelector(".ant-modal") as HTMLElement;
}

function spinbuttons() {
    return within(modal()).getAllByRole("spinbutton") as HTMLInputElement[];
}

describe("LocationGuards", () => {
    beforeEach(() => {
        findAllLocationGuards.mockReset();
        deleteLocationGuard.mockReset();
        addLocationGuard.mockReset();
        updateLocationGuard.mockReset();
        mockMap.invalidateSize.mockClear();
        mockMap.setView.mockClear();
        mapEventHandlers = {};
        findAllLocationGuards.mockResolvedValue([circle, square, broken] as never);
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "info").mockImplementation(() => ({}) as never);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = "";
    });

    it("lists the guards with their type, coordinates and radius, sorts and filters them", async () => {
        render(<LocationGuards/>);

        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(3));
        const rows = screen.getAllByTestId("row");
        expect(within(rows[0]).getByText("CIRCLE")).toBeTruthy();
        expect(within(rows[0]).getByText("60.16992, 24.93838")).toBeTruthy();
        expect(within(rows[0]).getByText("250")).toBeTruthy();
        expect(within(rows[0]).getAllByText("—")).toHaveLength(1);
        expect(within(rows[1]).getByText("SQUARE")).toBeTruthy();
        expect(within(rows[1]).getByText("60.20000, 25.00000")).toBeTruthy();
        expect(within(rows[2]).getAllByText("—")).toHaveLength(3);

        fireEvent.click(screen.getByRole("button", {name: "sort id"}));
        expect(within(screen.getAllByTestId("row")[0]).getByText("SQUARE")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", {name: "sort radius"}));
        expect(within(screen.getAllByTestId("row")[2]).getByText("250")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", {name: "filter guard_type"}));
        expect(screen.getAllByTestId("row")).toHaveLength(2);
    });

    it("reports a failed load", async () => {
        findAllLocationGuards.mockRejectedValue(new Error("down"));
        render(<LocationGuards/>);

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("LocationGuards.messages.fetchError"));
    });

    it("creates a circle guard from the form, the map click and the rounding button", async () => {
        addLocationGuard.mockResolvedValueOnce(circle as never).mockRejectedValueOnce(new Error("down"));
        render(<LocationGuards/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(3));

        fireEvent.click(screen.getByRole("button", {name: "LocationGuards.actions.new"}));
        await waitFor(() => expect(within(modal()).getByText("LocationGuards.modal.create.title")).toBeTruthy());
        // The map re-measures itself shortly after the modal opened
        await waitFor(() => expect(mockMap.invalidateSize).toHaveBeenCalled());

        // Submitting without coordinates fails validation and sends nothing
        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(within(modal()).getByText("LocationGuards.modal.latitude.validation.required")).toBeTruthy());
        expect(addLocationGuard).not.toHaveBeenCalled();

        // Without a coordinate the rounding button only explains how to use the map
        fireEvent.click(within(modal()).getByRole("button", {name: "LocationGuards.modal.buttons.useMap"}));
        expect(message.info).toHaveBeenCalledWith("LocationGuards.messages.mapClickInfo");

        // A click on the map fills the primary coordinate, rounded to five decimals
        act(() => mapEventHandlers.click?.({latlng: {lat: 60.1234567, lng: 24.9876543}}));
        await waitFor(() => expect(spinbuttons()[0].value).toBe("60.12346"));
        expect(spinbuttons()[1].value).toBe("24.98765");

        // The rounding button rounds a typed coordinate
        fireEvent.change(spinbuttons()[0], {target: {value: "60.123456"}});
        fireEvent.click(within(modal()).getByRole("button", {name: "LocationGuards.modal.buttons.useMap"}));
        await waitFor(() => expect(spinbuttons()[0].value).toBe("60.12346"));

        fireEvent.change(spinbuttons()[2], {target: {value: "100"}});
        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(addLocationGuard).toHaveBeenCalledWith({
            id: null, guard_type: GuardTypeEnum.CIRCLE, primary_coordinate: {latitude: 60.12346, longitude: 24.98765}, radius: 100, secondary_coordinate: null
        }));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("LocationGuards.messages.createSuccess"));
        expect(findAllLocationGuards).toHaveBeenCalledTimes(2);

        // A failed creation keeps the modal open and reports the error
        fireEvent.click(screen.getByRole("button", {name: "LocationGuards.actions.new"}));
        act(() => mapEventHandlers.click?.({latlng: {lat: 1, lng: 2}}));
        await waitFor(() => expect(spinbuttons()[0].value).toBe("1.00000"));
        fireEvent.change(spinbuttons()[2], {target: {value: "5"}});
        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("LocationGuards.messages.createError"));
    }, 15000);

    it("edits a square guard with its secondary coordinate and switches the type", async () => {
        updateLocationGuard.mockResolvedValueOnce(square as never).mockRejectedValueOnce(new Error("down"));
        render(<LocationGuards/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(3));

        fireEvent.click(within(screen.getAllByTestId("row")[1]).getByRole("button", {name: "LocationGuards.actions.edit"}));
        await waitFor(() => expect(within(modal()).getByText("LocationGuards.modal.edit.title")).toBeTruthy());
        await waitFor(() => expect(spinbuttons()).toHaveLength(4));
        expect(spinbuttons().map(input => input.value)).toEqual(["60.10000", "24.90000", "60.20000", "25.00000"]);
        expect(within(modal()).getByText("LocationGuards.modal.secondary.title")).toBeTruthy();
        expect(screen.getAllByTestId("marker").map(marker => marker.getAttribute("data-center"))).toEqual(["60.1,24.9", "60.2,25"]);

        // The secondary rounding button: a missing coordinate explains the map, a present one is rounded
        const useMapButtons = within(modal()).getAllByRole("button", {name: "LocationGuards.modal.buttons.useMap"});
        fireEvent.change(spinbuttons()[2], {target: {value: ""}});
        fireEvent.click(useMapButtons[1]);
        expect(message.info).toHaveBeenCalledWith("LocationGuards.messages.mapClickInfo");
        fireEvent.change(spinbuttons()[2], {target: {value: "60.2222222"}});
        fireEvent.click(useMapButtons[1]);
        await waitFor(() => expect(spinbuttons()[2].value).toBe("60.22222"));
        // A click on the second map sets the secondary coordinate
        act(() => mapEventHandlers.click?.({latlng: {lat: 61, lng: 26}}));
        await waitFor(() => expect(spinbuttons()[2].value).toBe("61.00000"));

        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(updateLocationGuard).toHaveBeenCalledWith({
            id: 1,
            guard_type: GuardTypeEnum.SQUARE,
            primary_coordinate: {latitude: 60.1, longitude: 24.9},
            secondary_coordinate: {latitude: 61, longitude: 26},
            radius: null
        }));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("LocationGuards.messages.updateSuccess"));

        // Switching the type to a circle hides the secondary coordinate and asks for a radius; a failed update is reported
        fireEvent.click(within(screen.getAllByTestId("row")[1]).getByRole("button", {name: "LocationGuards.actions.edit"}));
        await waitFor(() => expect(spinbuttons()).toHaveLength(4));
        fireEvent.mouseDown(within(modal()).getByRole("combobox"));
        fireEvent.click(await screen.findByText("CIRCLE", {selector: ".ant-select-item-option-content"}));
        await waitFor(() => expect(within(modal()).getByText("LocationGuards.modal.circle.title")).toBeTruthy());
        expect(spinbuttons()).toHaveLength(3);
        fireEvent.change(spinbuttons()[2], {target: {value: "40"}});
        fireEvent.click(within(modal()).getByRole("button", {name: "OK"}));
        await waitFor(() => expect(updateLocationGuard).toHaveBeenLastCalledWith(expect.objectContaining({
            id: 1, guard_type: GuardTypeEnum.CIRCLE, radius: 40, secondary_coordinate: null
        })));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("LocationGuards.messages.updateError"));

        fireEvent.click(within(modal()).getByRole("button", {name: "Cancel"}));
        await waitFor(() => {
            const wrap = document.querySelector(".ant-modal-wrap");
            expect(wrap === null || wrap.getAttribute("style")?.includes("display: none")).toBe(true);
        });
    }, 15000);

    it("deletes a guard after confirmation and reports failures", async () => {
        deleteLocationGuard.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("down"));
        render(<LocationGuards/>);
        await waitFor(() => expect(screen.getAllByTestId("row")).toHaveLength(3));

        fireEvent.click(within(screen.getAllByTestId("row")[0]).getByRole("button", {name: "LocationGuards.actions.delete"}));
        fireEvent.click(await screen.findByText("Common.popconfirm.yes"));
        await waitFor(() => expect(deleteLocationGuard).toHaveBeenCalledWith(2));
        await waitFor(() => expect(message.success).toHaveBeenCalledWith("LocationGuards.messages.deleteSuccess"));
        await waitFor(() => expect(findAllLocationGuards).toHaveBeenCalledTimes(2));

        fireEvent.click(within(screen.getAllByTestId("row")[1]).getByRole("button", {name: "LocationGuards.actions.delete"}));
        fireEvent.click((await screen.findAllByText("Common.popconfirm.yes")).at(-1)!);
        await waitFor(() => expect(deleteLocationGuard).toHaveBeenCalledWith(1));
        await waitFor(() => expect(message.error).toHaveBeenCalledWith("LocationGuards.messages.deleteError"));
    });
});
