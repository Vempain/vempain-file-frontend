import {fileGroupPathToIdentifier} from "../tools/dataTools";

describe("fileGroupPathToIdentifier", () => {
    it("converts a simple path with subdirectories to a valid identifier", () => {
        expect(fileGroupPathToIdentifier("/photos/2024/Paris")).toBe("photos_2024_paris");
    });

    it("converts a root-level path to a valid identifier", () => {
        expect(fileGroupPathToIdentifier("/images")).toBe("images");
    });

    it("replaces spaces and non-alphanumeric characters with underscores", () => {
        expect(fileGroupPathToIdentifier("/my photos/summer 2023")).toBe("my_photos_summer_2023");
    });

    it("strips leading and trailing underscores from the result", () => {
        expect(fileGroupPathToIdentifier("/-photos-")).toBe("photos");
    });

    it("lowercases uppercase letters", () => {
        expect(fileGroupPathToIdentifier("/PHOTOS/MyAlbum")).toBe("photos_myalbum");
    });

    it("returns fallback identifier for an empty string", () => {
        expect(fileGroupPathToIdentifier("")).toBe("gps_time_series");
    });

    it("returns fallback identifier for a path containing only non-alphanumeric characters", () => {
        expect(fileGroupPathToIdentifier("/---/___")).toBe("gps_time_series");
    });

    it("collapses consecutive non-alphanumeric characters into a single underscore", () => {
        expect(fileGroupPathToIdentifier("/a//b///c")).toBe("a_b_c");
    });

    it("handles a path that has no leading slash", () => {
        expect(fileGroupPathToIdentifier("albums/jazz")).toBe("albums_jazz");
    });

    it("handles digits in path segments", () => {
        expect(fileGroupPathToIdentifier("/2024/01/Paris")).toBe("2024_01_paris");
    });
});
