export function resolveApiUrl(): string {
    return process.env.VITE_APP_API_URL ?? "";
}
