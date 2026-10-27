import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {stickyTableHeader, TOP_BAR_HEIGHT} from "../../tools/tableStickyConfig";

describe("tableStickyConfig", () => {
    it("docks the sticky table header right below the fixed top bar", () => {
        expect(stickyTableHeader).toEqual({offsetHeader: TOP_BAR_HEIGHT});
    });

    it("matches the top bar height declared in index.css", () => {
        const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
        expect(css).toMatch(new RegExp(`\\.topbar-header\\s*\\{\\s*height:\\s*${TOP_BAR_HEIGHT}px;`));
    });
});
