import {viteEnv} from "../viteEnv";

export function resolveFooterConfig(): {
    copyright: string;
    poweredBy: string;
} {
    try {
        const env = viteEnv();
        return {
            copyright: env.VITE_APP_VEMPAIN_COPYRIGHT_FOOTER ?? "",
            poweredBy: env.VITE_APP_POWERED_BY_VEMPAIN ?? "",
        };
    } catch {
        return {
            copyright: typeof process !== "undefined" ? process.env.VITE_APP_VEMPAIN_COPYRIGHT_FOOTER ?? "" : "",
            poweredBy: typeof process !== "undefined" ? process.env.VITE_APP_POWERED_BY_VEMPAIN ?? "" : "",
        };
    }
}
