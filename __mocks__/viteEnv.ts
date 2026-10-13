/**
 * Jest stand-in for `src/viteEnv.ts`: Vite's `import.meta.env` is unavailable in the CommonJS test runtime, so the `VITE_*`
 * variables come from `process.env` (populated by `jest.setup.ts` and the tests themselves).
 */
export function viteEnv(): ImportMetaEnv {
    const env: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith("VITE_")) {
            env[key] = value;
        }
    }
    return env as unknown as ImportMetaEnv;
}
