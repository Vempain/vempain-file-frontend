import {formatByteSize} from "../../tools/byteSizeTool";

describe("formatByteSize", () => {
    it("formats bytes below one kilobyte without a fraction", () => {
        expect(formatByteSize(0)).toBe("0 B");
        expect(formatByteSize(1023)).toBe("1023 B");
    });

    it("formats kilobytes, megabytes, gigabytes and terabytes with two decimals", () => {
        expect(formatByteSize(1024)).toBe("1.00 kB");
        expect(formatByteSize(1536)).toBe("1.50 kB");
        expect(formatByteSize(1024 * 1024)).toBe("1.00 MB");
        expect(formatByteSize(5 * 1024 * 1024 + 512 * 1024)).toBe("5.50 MB");
        expect(formatByteSize(1024 * 1024 * 1024)).toBe("1.00 GB");
        expect(formatByteSize(1024 * 1024 * 1024 * 1024)).toBe("1.00 TB");
        expect(formatByteSize(3 * 1024 * 1024 * 1024 * 1024)).toBe("3.00 TB");
    });
});
