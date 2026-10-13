/**
 * The only module that reads Vite's `import.meta.env`. Vite replaces `import.meta.env` with the `VITE_*` variables at build and
 * dev time; Jest maps this module to `__mocks__/viteEnv.ts` (which reads `process.env`), because the CommonJS test runtime
 * cannot parse `import.meta`. Keep every other module free of `import.meta` so that it stays testable.
 */
export function viteEnv(): ImportMetaEnv {
    return import.meta.env;
}
