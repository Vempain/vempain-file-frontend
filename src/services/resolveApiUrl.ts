/**
 * Resolves the API base URL.
 *
 * Vite statically replaces `import.meta.env.VITE_APP_API_URL` at build/dev time.
 * In Jest (ts-jest / CJS), import.meta is unavailable so we fall back to process.env
 * which is populated by jest.setup.ts.
 */
export function resolveApiUrl(): string {
    try {
        // Vite replaces this literal at build time; at dev-time import.meta.env is a real object.
        const viteUrl = import.meta.env.VITE_APP_API_URL;
        if (viteUrl) return viteUrl;
    } catch {
        // import.meta is not available (Jest / CJS)
    }
    // Fallback for Jest and other non-Vite environments
    if (typeof process !== "undefined" && process.env?.VITE_APP_API_URL) {
        return process.env.VITE_APP_API_URL;
    }
    return "";
}
