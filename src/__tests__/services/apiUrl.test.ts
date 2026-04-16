import {constructorSpy, resetServiceMockState} from "../../testUtils/mockAuthFrontend";

describe("API service instantiation", () => {
    beforeEach(() => {
        resetServiceMockState();
    });
    it("apiUrl is set from process.env.VITE_APP_API_URL in test environment", () => {
        expect(process.env.VITE_APP_API_URL).toBe("http://localhost:8080/api");
    });
    it("all API services are instantiated with the /api base URL prefix", async () => {
        const {ArchiveFileAPI} = await import("../../services/ArchiveFileAPI");
        const {FileGroupAPI} = await import("../../services/FileGroupAPI");
        const {TagsAPI} = await import("../../services/TagsAPI");
        const baseUrl = process.env.VITE_APP_API_URL!;
        resetServiceMockState();
        new ArchiveFileAPI(baseUrl, "/files/archive");
        new FileGroupAPI(baseUrl, "/file-groups");
        new TagsAPI(baseUrl, "/tags");
        for (const call of constructorSpy.mock.calls) {
            expect(call[0]).toBe("http://localhost:8080/api");
            expect(call[0]).toContain("/api");
        }
    });
});
