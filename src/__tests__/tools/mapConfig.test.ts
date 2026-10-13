/**
 * mapConfig reads the tile URL and attribution through viteEnv() (mapped to process.env in Jest) when the module loads, so
 * every case re-imports it in isolation.
 */
function loadMapConfig(): { MAP_TILE_URL: string; MAP_ATTRIBUTION: string } {
    let config: { MAP_TILE_URL: string; MAP_ATTRIBUTION: string } | undefined;
    jest.isolateModules(() => {
        config = jest.requireActual("../../tools/mapConfig");
    });
    return config!;
}

describe("mapConfig", () => {
    const originalTileUrl = process.env.VITE_MAP_TILE_URL;
    const originalAttribution = process.env.VITE_MAP_ATTRIBUTION;

    afterEach(() => {
        process.env.VITE_MAP_TILE_URL = originalTileUrl;
        process.env.VITE_MAP_ATTRIBUTION = originalAttribution;
        if (originalTileUrl === undefined) delete process.env.VITE_MAP_TILE_URL;
        if (originalAttribution === undefined) delete process.env.VITE_MAP_ATTRIBUTION;
    });

    it("falls back to OpenStreetMap when nothing is configured", () => {
        delete process.env.VITE_MAP_TILE_URL;
        delete process.env.VITE_MAP_ATTRIBUTION;

        const config = loadMapConfig();

        expect(config.MAP_TILE_URL).toBe("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
        expect(config.MAP_ATTRIBUTION).toContain("OpenStreetMap");
    });

    it("uses the configured tile server and attribution", () => {
        process.env.VITE_MAP_TILE_URL = "https://tiles.example.org/{z}/{x}/{y}.png";
        process.env.VITE_MAP_ATTRIBUTION = "Example tiles";

        const config = loadMapConfig();

        expect(config.MAP_TILE_URL).toBe("https://tiles.example.org/{z}/{x}/{y}.png");
        expect(config.MAP_ATTRIBUTION).toBe("Example tiles");
    });
});
