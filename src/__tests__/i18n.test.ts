/**
 * i18n.ts configures i18next when it loads: the HTTP backend, the React binding, the translation-check plugin, and the
 * fallback and supported languages from the Vite environment (viteEnv(), mapped to process.env in Jest).
 */
jest.mock("i18next", () => {
    const instance = {use: jest.fn(), init: jest.fn()};
    instance.use.mockReturnValue(instance);
    instance.init.mockReturnValue(instance);
    return {__esModule: true, default: instance};
});
jest.mock("react-i18next", () => ({initReactI18next: {type: "3rdParty", name: "react"}}));
jest.mock("i18next-http-backend", () => ({__esModule: true, default: {type: "backend", name: "http"}}));
jest.mock("translation-check", () => ({i18nextPlugin: {type: "3rdParty", name: "translation-check"}}));

type I18nMock = { use: jest.Mock; init: jest.Mock };

function loadI18n(env: Record<string, string | undefined>): { i18n: I18nMock; exported: unknown } {
    for (const [key, value] of Object.entries(env)) {
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    }
    let i18n: I18nMock | undefined;
    let exported: unknown;
    jest.isolateModules(() => {
        exported = (jest.requireActual("../i18n") as { default: unknown }).default;
        i18n = (jest.requireMock("i18next") as { default: I18nMock }).default;
    });
    return {i18n: i18n!, exported};
}

describe("i18n", () => {
    const originalDefault = process.env.VITE_I18N_DEFAULT_LANG;
    const originalSupported = process.env.VITE_I18N_SUPPORTED_LANGS;

    afterEach(() => {
        process.env.VITE_I18N_DEFAULT_LANG = originalDefault;
        process.env.VITE_I18N_SUPPORTED_LANGS = originalSupported;
        if (originalDefault === undefined) delete process.env.VITE_I18N_DEFAULT_LANG;
        if (originalSupported === undefined) delete process.env.VITE_I18N_SUPPORTED_LANGS;
    });

    it("registers the backend, the React binding and the translation check, and restricts the languages from the environment", () => {
        const {i18n, exported} = loadI18n({VITE_I18N_DEFAULT_LANG: "fi", VITE_I18N_SUPPORTED_LANGS: "en, fi ,sv"});

        expect(exported).toBe(i18n);
        expect(i18n.use.mock.calls.map(call => call[0].name)).toEqual(["http", "react", "translation-check"]);
        expect(i18n.init).toHaveBeenCalledWith({
            fallbackLng: "fi",
            debug: false,
            supportedLngs: ["en", "fi", "sv"],
            backend: {loadPath: "/locales/{{lng}}.json"}
        });
    });

    it("falls back to English without a language restriction when nothing is configured", () => {
        const {i18n} = loadI18n({VITE_I18N_DEFAULT_LANG: undefined, VITE_I18N_SUPPORTED_LANGS: undefined});

        expect(i18n.init).toHaveBeenCalledWith(expect.objectContaining({fallbackLng: "en", supportedLngs: false}));
    });
});
