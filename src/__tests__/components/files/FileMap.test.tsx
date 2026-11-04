import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {FileMap} from "../../../components/files/FileMap";
import {toFileDetails} from "../../../tools/mapFileTools";
import {mapAPI, tagAPI} from "../../../services";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key})
}));

// The shared map view of the common library is its contract stub (__mocks__/@vempain/vempain-common-frontend.tsx)
jest.mock("@vempain/vempain-common-frontend", () => jest.requireActual("../../../../__mocks__/@vempain/vempain-common-frontend"));

jest.mock("../../../services", () => ({
    mapAPI: {getClusters: jest.fn(), getClusterFiles: jest.fn()},
    tagAPI: {findPageable: jest.fn()},
    fileContentAPI: {getFileContent: jest.fn(() => new Promise(() => undefined))}
}));

jest.mock("../../../components/files/FileDetails", () => ({
    FileDetails: ({file}: { file: { filename?: string; location?: { latitude: number; latitude_ref: string; longitude: number; longitude_ref: string } } }) =>
            <div data-testid="file-details">{file.filename} {file.location?.latitude}{file.location?.latitude_ref} {file.location?.longitude}{file.location?.longitude_ref}</div>
}));

jest.mock("../../../components/files/FileDisplay", () => ({
    FileDisplay: ({id, maxSize, source}: { id: number; maxSize: number; source?: string }) => <div data-testid="file-display" data-id={id} data-max-size={maxSize} data-source={source}/>
}));

const findPageable = jest.mocked(tagAPI.findPageable);

describe("FileMap", () => {
    beforeEach(() => {
        findPageable.mockReset();
        findPageable.mockResolvedValue({content: [{id: 1, tag_name: "summer"}, {id: 2, tag_name: "sunset"}]} as never);
    });

    it("mounts the shared map over the file backend's map API with the file types, tiles and tag search", async () => {
        render(<FileMap/>);

        expect(screen.getByText("Map of files")).toBeTruthy();
        const view = screen.getByTestId("map-view");
        expect(view.dataset.source).toBe("set");
        expect(view.dataset.fileTypes?.split(",")).toEqual(expect.arrayContaining(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"]));
        expect(view.dataset.fileTypes).not.toContain("THUMB");
        expect(view.dataset.fileTypeLabels?.split(",")).toContain("IMAGE");
        expect(view.dataset.tileUrl).toContain("tile.openstreetmap.org");
        expect(mapAPI).toBeDefined();

        fireEvent.click(screen.getByText("stub: search tags"));
        await waitFor(() => expect(screen.getByTestId("map-stub-tags").textContent).toBe("summer,sunset"));
        expect(findPageable).toHaveBeenCalledWith({page: 0, size: 20, search: "sum", sort_by: "tag_name", direction: "ASC"});
    });

    it("shows a clicked file with the file details view and its thumbnail through the content endpoint", () => {
        render(<FileMap/>);

        fireEvent.click(screen.getByText("stub: open file"));

        // the thumb file of the resource is displayed, the details carry the signed coordinates as hemisphere and value
        expect(screen.getByTestId("file-display").dataset.id).toBe("42");
        expect(screen.getByTestId("file-display").dataset.source).toBe("thumbnail");
        expect(screen.getByTestId("file-display").dataset.maxSize).toBe("240");
        expect(screen.getByTestId("file-details").textContent).toBe("stub.jpg 60.17123N 24.94156W");
    });

    it("maps a map file to the details view, falling back to the file itself as the thumbnail", () => {
        const details = toFileDetails({
            id: 5, filename: "a.jpg", file_path: "/p", file_type: "IMAGE", mimetype: "image/jpeg", latitude: -33.9, longitude: 151.2,
            original_datetime: "2026-06-01T12:00:00Z", thumbnail_id: null
        });
        expect(details.id).toBe(5);
        expect(details.file_type).toBe("IMAGE");
        expect(details.original_datetime?.toISOString()).toBe("2026-06-01T12:00:00.000Z");
        expect(details.location).toEqual({latitude: 33.9, latitude_ref: "S", longitude: 151.2, longitude_ref: "E"});
        const withoutDate = toFileDetails({id: 6, filename: "b", file_path: "/", file_type: "VIDEO", mimetype: "video/mp4", latitude: 1, longitude: 2,
            original_datetime: null, thumbnail_id: null});
        expect(withoutDate.original_datetime).toBeNull();
    });
});
