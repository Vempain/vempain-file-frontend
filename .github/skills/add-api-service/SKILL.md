---
name: add-api-service
description: Add a backend API client to the file frontend (class extending AbstractAPI or AbstractFileAPI, singleton in services/index.ts, snake_case models, service test). Use when a screen needs a new backend resource or endpoint.
---

# Add an API service to vempain-file-frontend

- One `src/services/<Name>API.ts` per backend resource. Typed file lists extend `AbstractFileAPI<Request, Response>` (adds
  `findAllPageable`); everything else extends `AbstractAPI<Request, Response>` from `@vempain/vempain-auth-frontend`
  (`findAll`, `findPageable` = `POST <base>/paged`, `findById`, `create`, `update`, `delete`). Methods beyond those call
  `this.setAuthorizationHeader()` and use `this.axiosInstance` with a path relative to the member path (`"files/paged"`, `"value"`).
- Export the class and create the singleton in `src/services/index.ts`: `export const xxxAPI = new XxxAPI(apiUrl, '/<member>')`
  (`apiUrl` from `resolveApiUrl()`, which keeps `import.meta` out of test code). Only the publishing schedule screens use the admin backend
  (`resolveAdminApiUrl`); user and unit management stays on this backend.
- Models in `src/models/requests` and `src/models/responses` (export from the `index.ts` files) mirror the backend DTO field names in
  snake_case; a `202` endpoint returns `TaskAcceptedResponse` from `@vempain/vempain-common-frontend`.
- Test in `src/__tests__/services/<Name>API.test.ts` using `src/testUtils/mockAuthFrontend` (`axiosMock`, `constructorSpy`,
  `setAuthorizationHeaderSpy`, `resetServiceMockState`): assert the member path, the posted path and body, and the returned data.
- Keep the backend's `AGENTS.md`/API in sync: a new endpoint here must exist in `vempain-file-backend` (`MetadataAPI`, `TagAPI`, ...).
