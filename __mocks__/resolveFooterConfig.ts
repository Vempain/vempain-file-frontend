export function resolveFooterConfig(): {
    copyright: string;
    poweredBy: string;
} {
    return {
        copyright: process.env.VITE_APP_VEMPAIN_COPYRIGHT_FOOTER ?? "",
        poweredBy: process.env.VITE_APP_POWERED_BY_VEMPAIN ?? "",
    };
}
