let isHandlingUnauthorized = false;

const AUTH_STORAGE_KEY = "vempainUser";

export function handleUnauthorized(): void {
    if (isHandlingUnauthorized) {
        return;
    }

    isHandlingUnauthorized = true;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.assign("/login");
}

