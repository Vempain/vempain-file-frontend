import {viteEnv} from "../viteEnv";

/**
 * Resolves the API base URL.
 *
 * Vite statically replaces `import.meta.env` (read through `viteEnv()`) at build/dev time. In Jest (ts-jest / CJS) the
 * `viteEnv` module is mapped to a stand-in that reads `process.env`, which is populated by jest.setup.ts.
 */
export function resolveApiUrl(): string {
    try {
        // Vite replaces this at build time; at dev-time import.meta.env is a real object.
        const viteUrl = viteEnv().VITE_APP_API_URL;
        if (viteUrl) return viteUrl;
    } catch {
        // import.meta is not available (non-Vite runtime)
    }
    // Fallback for Jest and other non-Vite environments
    if (typeof process !== "undefined" && process.env?.VITE_APP_API_URL) {
        return process.env.VITE_APP_API_URL;
    }
    return "";
}
