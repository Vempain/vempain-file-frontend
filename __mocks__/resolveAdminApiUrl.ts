export function resolveAdminApiUrl(): string {
    return process.env.VITE_APP_ADMIN_API_URL ?? process.env.VITE_APP_API_URL ?? "";
}
