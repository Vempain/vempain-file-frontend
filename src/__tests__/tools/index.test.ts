import * as tools from "../../tools";

/** The tools barrel exposes every helper of the folder; the helpers themselves are tested in their own suites. */
describe("tools barrel", () => {
    it("exports every helper", () => {
        expect(tools.formatByteSize(512)).toBe("512 B");
        expect(tools.compareDayjsNullable(null, null)).toBe(0);
        expect(tools.formatDayjsNullable(null)).toBe("");
        expect(tools.formatDateWithTimeZone(null)).toBe("");
        expect(tools.fileGroupPathToIdentifier("/a/b")).toBe("a_b");
        expect(tools.fileGroupDatasetToIdentifier("/a", "b")).toBe("a-b");
        expect(typeof tools.fileTypeEnum2Tag).toBe("function");
        expect(typeof tools.pathCompletionEnum2Tag).toBe("function");
        expect(tools.LanguageTool.getLanguages()).toHaveLength(3);
        expect(tools.getPaginationConfig(3).total).toBe(3);
        expect(tools.MAP_TILE_URL).toContain("{z}");
        expect(tools.MAP_ATTRIBUTION).toContain("OpenStreetMap");
        expect(tools.metadataRowKey({metadata_group: "g", metadata_key: "k", metadata_value: "v", file_count: 1, writable: true})).toBe("g\u0000k\u0000v");
    });
});
