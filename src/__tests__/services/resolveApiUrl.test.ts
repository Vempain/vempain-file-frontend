/**
 * The resolvers read Vite's environment through viteEnv(), which Jest maps to a process.env stand-in, so every case
 * sets process.env and loads the module in isolation. The "viteEnv throws" cases cover the non-Vite runtime fallback.
 */
type Env = Record<string, string | undefined>;

const ENV_KEYS = ["VITE_APP_API_URL", "VITE_APP_ADMIN_API_URL"];
const original: Env = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));

function applyEnv(env: Env) {
    for (const key of ENV_KEYS) {
        if (env[key] === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = env[key];
        }
    }
}

function load<T>(modulePath: string, env: Env, viteEnvThrows = false): T {
    applyEnv(env);
    let loaded: T | undefined;
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
        loaded = jest.requireActual(modulePath) as T;
    });
    return loaded!;
}

type ApiUrlModule = { resolveApiUrl: () => string };
type AdminApiUrlModule = { resolveAdminApiUrl: () => string };

afterEach(() => applyEnv(original));

describe("resolveApiUrl", () => {
    it("returns the configured Vite API URL", () => {
        const {resolveApiUrl} = load<ApiUrlModule>("../../services/resolveApiUrl", {VITE_APP_API_URL: "https://files.example.org/api"});
        expect(resolveApiUrl()).toBe("https://files.example.org/api");
    });

    it("falls back to process.env when Vite's environment is unavailable", () => {
        const {resolveApiUrl} = load<ApiUrlModule>("../../services/resolveApiUrl", {VITE_APP_API_URL: "http://fallback:8080/api"}, true);
        expect(resolveApiUrl()).toBe("http://fallback:8080/api");
    });

    it("returns an empty string when nothing is configured", () => {
        const {resolveApiUrl} = load<ApiUrlModule>("../../services/resolveApiUrl", {VITE_APP_API_URL: undefined});
        expect(resolveApiUrl()).toBe("");
    });
});

describe("resolveAdminApiUrl", () => {
    it("prefers the explicitly configured admin API URL", () => {
        const {resolveAdminApiUrl} = load<AdminApiUrlModule>("../../services/resolveAdminApiUrl", {
            VITE_APP_API_URL: "http://localhost:8080/api",
            VITE_APP_ADMIN_API_URL: "https://admin.example.org/api"
        });
        expect(resolveAdminApiUrl()).toBe("https://admin.example.org/api");
    });

    it("maps the local file backend port 8080 to the admin backend port 9999", () => {
        const {resolveAdminApiUrl} = load<AdminApiUrlModule>("../../services/resolveAdminApiUrl", {
            VITE_APP_API_URL: "http://localhost:8080/api",
            VITE_APP_ADMIN_API_URL: undefined
        });
        expect(resolveAdminApiUrl()).toBe("http://localhost:9999/api");
    });

    it("keeps the file API URL when the host is neither local nor a vempain-file host", () => {
        const {resolveAdminApiUrl} = load<AdminApiUrlModule>("../../services/resolveAdminApiUrl", {
            VITE_APP_API_URL: "https://files.example.org/api",
            VITE_APP_ADMIN_API_URL: undefined
        });
        // jsdom runs on localhost, which does not contain "vempain-file"
        expect(resolveAdminApiUrl()).toBe("https://files.example.org/api");
    });

    it("falls back to process.env when Vite's environment is unavailable", () => {
        const {resolveAdminApiUrl: withAdmin} = load<AdminApiUrlModule>("../../services/resolveAdminApiUrl", {
            VITE_APP_API_URL: "http://fallback:8080/api",
            VITE_APP_ADMIN_API_URL: "http://fallback-admin:9999/api"
        }, true);
        expect(withAdmin()).toBe("http://fallback-admin:9999/api");

        const {resolveAdminApiUrl: withFileOnly} = load<AdminApiUrlModule>("../../services/resolveAdminApiUrl", {
            VITE_APP_API_URL: "http://fallback:8080/api",
            VITE_APP_ADMIN_API_URL: undefined
        }, true);
        expect(withFileOnly()).toBe("http://fallback:8080/api");

        const {resolveAdminApiUrl: withNothing} = load<AdminApiUrlModule>("../../services/resolveAdminApiUrl", {
            VITE_APP_API_URL: undefined,
            VITE_APP_ADMIN_API_URL: undefined
        }, true);
        expect(withNothing()).toBe("");
    });
});
