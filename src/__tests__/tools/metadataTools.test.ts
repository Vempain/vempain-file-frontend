import {metadataRowKey} from "../../tools/metadataTools";

describe("metadataRowKey", () => {
    it("joins group, key and value with a separator that cannot occur in the values", () => {
        expect(metadataRowKey({metadata_group: "XMP-dc", metadata_key: "Creator", metadata_value: "Jane Doe", file_count: 1, writable: true}))
            .toBe("XMP-dc\u0000Creator\u0000Jane Doe");
    });

    it("distinguishes rows that differ only by value", () => {
        const first = metadataRowKey({metadata_group: "EXIF", metadata_key: "Make", metadata_value: "Canon", file_count: 2, writable: true});
        const second = metadataRowKey({metadata_group: "EXIF", metadata_key: "Make", metadata_value: "", file_count: 2, writable: true});
        expect(first).not.toBe(second);
    });
});
