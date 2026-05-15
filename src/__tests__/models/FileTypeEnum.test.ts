import {FileTypeEnum} from "../../models";

describe("FileTypeEnum", () => {
    it("contains all backend-supported file types", () => {
        expect(Object.values(FileTypeEnum).sort()).toEqual([
            "ARCHIVE",
            "AUDIO",
            "BINARY",
            "DATA",
            "DOCUMENT",
            "EXECUTABLE",
            "FONT",
            "ICON",
            "IMAGE",
            "INTERACTIVE",
            "MUSIC",
            "THUMB",
            "UNKNOWN",
            "VECTOR",
            "VIDEO",
        ]);
    });
});

