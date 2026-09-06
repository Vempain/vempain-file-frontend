export function resolveAdminApiUrl(): string {
    try {
        const configured = import.meta.env.VITE_APP_ADMIN_API_URL;
        if (configured) return configured;

        const fileApi = import.meta.env.VITE_APP_API_URL;
        if (fileApi?.includes("localhost:8080")) {
            return fileApi.replace("localhost:8080", "localhost:9999");
        }
        if (typeof window !== "undefined" && window.location.hostname.includes("vempain-file")) {
            return fileApi.replace(window.location.hostname, window.location.hostname.replace("vempain-file", "vempain-admin"));
        }
        return fileApi;
    } catch {
        return typeof process !== "undefined" ? process.env.VITE_APP_ADMIN_API_URL ?? process.env.VITE_APP_API_URL ?? "" : "";
    }
}
