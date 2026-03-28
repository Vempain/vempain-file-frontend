# AGENTS.md

## Big picture

- `src/index.tsx` is the true app entry: the tree is `I18nextProvider` → `SessionProvider` from `@vempain/vempain-auth-frontend` → `BrowserRouter` → `App`.
- `src/App.tsx` owns all routes and the Ant Design dark theme. `src/main/TopBar.tsx` owns the visible navigation. If you add or rename a page, update both files
  together.
- This frontend is a typed client for a separate backend. Most UI work is CRUD/search/listing over backend resources, not local business logic.

## Service layer and auth

- All API clients must extend `AbstractAPI` from `@vempain/vempain-auth-frontend`, or `src/services/AbstractFileAPI.ts` if they need the shared pageable
  `findAllPageable(page, size)` behavior.
- Examples: `src/services/TagsAPI.ts` extends `AbstractAPI`; `src/services/ImageFileAPI.ts` extends `AbstractFileAPI`.
- Service instances are created with `import.meta.env.VITE_APP_API_URL` plus a resource path, e.g. `new FileScannerAPI(..., "/scan-files")`.
- Auth/session expiry handling now lives in the shared auth library interceptor; keep using these base classes so 401 responses trigger logout correctly.

## Data contract conventions

- Backend DTO naming is preserved in the frontend. Use snake_case fields like `group_name`, `file_path`, `scan_original_response`, `total_elements` exactly as
  returned by the backend.
- Do **not** “React-ify” API models into camelCase inside components unless you are intentionally mapping them.
- File-group and pageable APIs are server-driven: Ant Design tables stay 1-based, backend requests are 0-based (`page: currentPage - 1`). See
  `src/components/files/FileGroups.tsx` and `src/components/files/ImageFiles.tsx`.

## TypeScript constraints specific to this repo

- `tsconfig.app.json` enables `strict`, `verbatimModuleSyntax`, and `erasableSyntaxOnly`.
- Use `import type` for type-only imports.
- Do not add TypeScript `enum`; follow the existing const-object pattern in files like `src/models/FileTypeEnum.ts` and `src/models/GuardTypeEnum.ts`.
- `allowImportingTsExtensions` is enabled, so this codebase sometimes imports `*.ts` explicitly; match the surrounding file style instead of “fixing” it
  globally.

## UI/component patterns

- File listing screens (`ArchiveFiles`, `ImageFiles`, `VideoFiles`, etc.) share a pattern: fetch paged data, render an Ant Design `Table`, reuse helpers from
  `src/components/files/commonColumns.tsx`, and open `FileDetails` in a `Modal`.
- `src/components/files/FileDetails.tsx` is the canonical metadata viewer. GPS/location rendering is delegated to `src/components/common/DisplayMap.tsx` using
  React-Leaflet.
- `src/components/files/ImportFiles.tsx` shows the expected path-autocomplete pattern: two `AutoComplete` inputs, backend completion requests, then result
  tables.
- `src/components/management/LocationGuards.tsx` is the best reference for form + modal + map integration.

## i18n and text

- UI strings should go through `useTranslation()` and keys in `public/locales/*.json`.
- Runtime translation loading is configured in `src/i18n.ts`; no rebuild is needed for locale JSON changes.
- It is normal here to provide `defaultValue` in some `t(...)` calls for new/incomplete translation coverage.
- Session language comes from the auth session; `App.tsx` syncs it into i18next.

## Build, test, and local workflows

- Install with Yarn 4: `yarn install`.
- Dev server: `yarn start` (runs `generateBuildInfo.js` first, then `env-cmd -f .env.local vite`). Vite default port is `3000` in `vite.config.ts`.
- Production build: `yarn build` or `yarn build:production`.
- Lint and tests: `yarn lint`, `yarn test`, `yarn test:coverage`.
- `generateBuildInfo.js` writes `src/buildInfo.json` from `VERSION` and git tags; build/version issues often come from missing tags in CI checkouts.
- Code currently reads `VITE_APP_API_URL` from `src/index.tsx` and service constructors; prefer that name even though `README.md` still mentions
  `VITE_API_BASE_URL`.

## Practical gotchas for agents

- When adding a new list screen, prefer reusing `commonColumns.tsx` and `FileDetails` before inventing new table column renderers.
- When adding sorting/search to Ant Design tables backed by the server, copy the `FileGroups.tsx` pattern: local `sortField/sortOrder/searchTerm/caseSensitive`
  state, then fetch in a `useCallback` + `useEffect` pair.
- When adding routes, check for matching `NavLink`s in `TopBar.tsx`; the menu is conditional on `userSession`.
- Footer/version text comes from `src/buildInfo.json` plus `VITE_APP_VEMPAIN_*` env vars in `src/main/BottomFooter.tsx`.

