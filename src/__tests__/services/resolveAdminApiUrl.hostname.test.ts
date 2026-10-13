/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://vempain-file.example.org/"}
 */

/** On a vempain-file host the admin backend lives on the matching vempain-admin host. */
describe("resolveAdminApiUrl on a vempain-file host", () => {
    const originalApiUrl = process.env.VITE_APP_API_URL;
    const originalAdminUrl = process.env.VITE_APP_ADMIN_API_URL;

    afterEach(() => {
        process.env.VITE_APP_API_URL = originalApiUrl;
        if (originalAdminUrl === undefined) {
            delete process.env.VITE_APP_ADMIN_API_URL;
        } else {
            process.env.VITE_APP_ADMIN_API_URL = originalAdminUrl;
        }
    });

    it("derives the admin host from the file host", () => {
        process.env.VITE_APP_API_URL = "https://vempain-file.example.org/api";
        delete process.env.VITE_APP_ADMIN_API_URL;
        let resolveAdminApiUrl: () => string = () => "";
        jest.isolateModules(() => {
            ({resolveAdminApiUrl} = jest.requireActual("../../services/resolveAdminApiUrl"));
        });

        expect(window.location.hostname).toBe("vempain-file.example.org");
        expect(resolveAdminApiUrl()).toBe("https://vempain-admin.example.org/api");
    });
});
