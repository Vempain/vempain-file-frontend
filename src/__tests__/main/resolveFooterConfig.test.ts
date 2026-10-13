type FooterModule = { resolveFooterConfig: () => { copyright: string; poweredBy: string } };

const KEYS = ["VITE_APP_VEMPAIN_COPYRIGHT_FOOTER", "VITE_APP_POWERED_BY_VEMPAIN"];
const original = Object.fromEntries(KEYS.map(key => [key, process.env[key]]));

function applyEnv(env: Record<string, string | undefined>) {
    for (const key of KEYS) {
        if (env[key] === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = env[key];
        }
    }
}

function load(env: Record<string, string | undefined>, viteEnvThrows = false): FooterModule {
    applyEnv(env);
    let loaded: FooterModule | undefined;
    jest.isolateModules(() => {
        if (viteEnvThrows) {
            jest.doMock("../../viteEnv", () => ({
                viteEnv: () => {
                    throw new Error("import.meta is not available");
                }
            }));
        } else {
            jest.dontMock("../../viteEnv");
        }
        loaded = jest.requireActual("../../main/resolveFooterConfig");
    });
    return loaded!;
}

afterEach(() => applyEnv(original));

describe("resolveFooterConfig", () => {
    it("reads the copyright and powered-by texts from Vite's environment", () => {
        const {resolveFooterConfig} = load({
            VITE_APP_VEMPAIN_COPYRIGHT_FOOTER: "Vempain project © 2026",
            VITE_APP_POWERED_BY_VEMPAIN: "Powered by Vempain"
        });
        expect(resolveFooterConfig()).toEqual({copyright: "Vempain project © 2026", poweredBy: "Powered by Vempain"});
    });

    it("uses empty texts when nothing is configured", () => {
        const {resolveFooterConfig} = load({VITE_APP_VEMPAIN_COPYRIGHT_FOOTER: undefined, VITE_APP_POWERED_BY_VEMPAIN: undefined});
        expect(resolveFooterConfig()).toEqual({copyright: "", poweredBy: ""});
    });

    it("falls back to process.env when Vite's environment is unavailable", () => {
        const {resolveFooterConfig: configured} = load({
            VITE_APP_VEMPAIN_COPYRIGHT_FOOTER: "fallback copyright",
            VITE_APP_POWERED_BY_VEMPAIN: "fallback powered"
        }, true);
        expect(configured()).toEqual({copyright: "fallback copyright", poweredBy: "fallback powered"});

        const {resolveFooterConfig: empty} = load({VITE_APP_VEMPAIN_COPYRIGHT_FOOTER: undefined, VITE_APP_POWERED_BY_VEMPAIN: undefined}, true);
        expect(empty()).toEqual({copyright: "", poweredBy: ""});
    });
});
