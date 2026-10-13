import type {ReactNode} from "react";
import {act, render, screen} from "@testing-library/react";
import {DisplayMap} from "../../../components/common/DisplayMap";
import type {LocationResponse} from "../../../models";

const mockMap = {invalidateSize: jest.fn(), setView: jest.fn()};

jest.mock("react-leaflet", () => ({
    MapContainer: ({children, center, zoom}: { children: ReactNode; center: [number, number]; zoom: number }) =>
            <div data-testid="map" data-center={center.join(",")} data-zoom={zoom}>{children}</div>,
    TileLayer: ({url, attribution}: { url: string; attribution: string }) => <div data-testid="tiles" data-url={url} data-attribution={attribution}/>,
    CircleMarker: ({center}: { center: [number, number] }) => <div data-testid="marker" data-center={center.join(",")}/>,
    useMap: () => mockMap
}));

const location: LocationResponse = {
    id: 1, latitude: 60.1699, latitude_ref: "N", longitude: 24.9384, longitude_ref: "E", altitude: null, direction: null,
    satellite_count: null, country: "FI", state: null, city: "Helsinki", street: null, sub_location: null
};

describe("DisplayMap", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockMap.invalidateSize.mockClear();
        mockMap.setView.mockClear();
    });

    afterEach(() => jest.useRealTimers());

    it("centers the map and the marker on the signed coordinates with the configured tiles", () => {
        render(<DisplayMap location={location} zoom={9} heightPx={100}/>);

        expect(screen.getByTestId("map").getAttribute("data-center")).toBe("60.1699,24.9384");
        expect(screen.getByTestId("map").getAttribute("data-zoom")).toBe("9");
        expect(screen.getByTestId("marker").getAttribute("data-center")).toBe("60.1699,24.9384");
        expect(screen.getByTestId("tiles").getAttribute("data-url")).toContain("tile.openstreetmap.org");
        expect(screen.getByTestId("tiles").getAttribute("data-attribution")).toContain("OpenStreetMap");
        expect(mockMap.setView).toHaveBeenCalledWith([60.1699, 24.9384]);
    });

    it("negates southern and western coordinates", () => {
        render(<DisplayMap location={{...location, latitude_ref: "S", longitude_ref: "W"}}/>);

        expect(screen.getByTestId("map").getAttribute("data-center")).toBe("-60.1699,-24.9384");
        expect(screen.getByTestId("map").getAttribute("data-zoom")).toBe("13");
    });

    it("invalidates the size shortly after becoming active and cancels it on unmount", () => {
        const {unmount} = render(<DisplayMap location={location}/>);
        expect(mockMap.invalidateSize).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(80);
        });
        expect(mockMap.invalidateSize).toHaveBeenCalledTimes(1);
        expect(mockMap.setView).toHaveBeenCalledTimes(2);

        unmount();
        mockMap.invalidateSize.mockClear();
        const {unmount: unmountSecond} = render(<DisplayMap location={location} active/>);
        unmountSecond();
        act(() => {
            jest.advanceTimersByTime(100);
        });
        expect(mockMap.invalidateSize).not.toHaveBeenCalled();
    });

    it("does not invalidate the size while inactive", () => {
        render(<DisplayMap location={location} active={false}/>);
        act(() => {
            jest.advanceTimersByTime(100);
        });

        expect(mockMap.invalidateSize).not.toHaveBeenCalled();
        expect(mockMap.setView).toHaveBeenCalledTimes(1);
    });
});
