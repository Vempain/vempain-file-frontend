import {getPaginationConfig} from "../tools/tablePaginationConfig";

describe("getPaginationConfig", () => {
    it("should return pagination config with the given total", () => {
        const total = 42;
        const config = getPaginationConfig(total);
        expect(config.total).toBe(total);
    });

    it("should include default pagination properties", () => {
        const config = getPaginationConfig(10);
        expect(config.position).toEqual(["topRight", "bottomRight"]);
        expect(config.defaultPageSize).toBe(15);
        expect(config.hideOnSinglePage).toBe(true);
        expect(config.showSizeChanger).toBe(true);
        expect(config.showQuickJumper).toBe(true);
        expect(config.pageSizeOptions).toEqual(["5", "10", "15", "20", "30", "50", "100"]);
    });
});

