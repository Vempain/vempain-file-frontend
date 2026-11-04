# vempain-file-frontend — Agent Guide

## Scope

- React 19 + TypeScript + Ant Design 6 single-page app (Vite) for the file service. It talks to `vempain-file-backend` (`VITE_APP_API_URL`),
  including user, unit and ACL management of the file service's own user base (`/content-management/users|units|acls`, hosted by the
  file backend from `vempain-auth-core`). Only the publishing schedule screens still reach the admin backend through `AdminScheduleAPI`
  (`resolveAdminApiUrl.ts`); never route user or unit management there, the two backends have separate user bases.
- Authentication, session handling and the base API client come from `@vempain/vempain-auth-frontend`; this repo must not reimplement them.

## Layout

| Path              | Purpose                                                                                            |
|-------------------|----------------------------------------------------------------------------------------------------|
| `src/App.tsx`     | Router: `/login`, `/logout`, `/files/<type>`, `/data/*`, management and tag routes                 |
| `src/main/`       | `TopBar`, `BottomFooter`, `Home`, `resolveFooterConfig`                                            |
| `src/components/` | Feature folders: `files/`, `data/`, `tags/`, `management/`, `schedules/`, `user/`, `common/`       |
| `src/services/`   | One `*API.ts` per backend resource; typed file APIs extend `AbstractFileAPI`                       |
| `src/models/`     | TS models (`requests/`, `responses/`, `*Enum.ts` as `as const` objects)                            |
| `src/tools/`      | Pure helpers (bytes, dates, enums to tags, map config, pagination)                                 |
| `src/__tests__/`  | Jest tests (`*.test.ts(x)`), mirroring the `src/` structure                                        |
| `src/testUtils/`  | Shared test doubles (`mockAuthFrontend.ts`)                                                        |
| `__mocks__/`      | Jest mocks for assets, styles, `src/viteEnv.ts` and the `@vempain/vempain-common-frontend` package |

- Every table is the shared `VempainTable` of `@vempain/vempain-auth-frontend`, never a raw Ant Design `Table`, and no screen passes
  `scroll={{x: ...}}`: a horizontally scrolling table is sized by its content and grew past the viewport (the library drops `scroll.x`
  anyway). The table fits its container by moving columns into the expandable row, so screens rank their columns with `priority` and give
  action columns a `width`. The list screens wrap their content in `Space` with `width: calc(100% - 60px)` and a 30 px margin (95 % plus
  the margins overflowed the viewport below 1200 px).

## Conventions

- Services: `class XxxFileAPI extends AbstractFileAPI<Request, Response>` (adds `findAllPageable` with the `POST <base>/paged` + `PagedRequest`
  contract); non-file services extend `AbstractAPI` directly. Export singletons built from `resolveApiUrl()`.
- Paged tables send zero-based `page`, `size`, optional `sort_by`/`direction`/`search` in a `PagedRequest` body; convert Ant Design's one-based
  pagination at the boundary.
- JSON contracts are snake_case end to end; TS models mirror the backend DTO field names.
- Do not add TypeScript `enum`; use `as const` objects plus a derived type (`src/models/FileTypeEnum.ts`).
- Route changes must be reflected in both `src/App.tsx` and `src/main/TopBar.tsx`.
- User and unit management (`src/components/management/{Users,UserEdit,Units,UnitEdit}.tsx`, `/management/users|units[/:id/edit]`) and the
  permissions overview are the shared screens of `@vempain/vempain-auth-frontend` (`UserList`, `UserEditor`, `UnitList`, `UnitEditor`,
  `AclEditor`, `AclAPI`) bound to `userAPI`/`unitAPI`/`aclAPI` from `src/services/` (library `UserAPI`/`UnitAPI`/`AclAPI` instances on the
  file backend URL). Nested units and the cycle check, the ACL rules and the editors are implemented and tested in the library; the
  tests here only cover the route hosts and the account screens (`changedComponents.test.tsx`).
- The create/edit modal of `FileGroups.tsx` and the data set screens (`src/components/data/PublishMusicData.tsx`, `PublishGpsTimeSeries.tsx`)
  use the `SplitActionButton` of `@vempain/vempain-common-frontend`: picking an action in its menu only changes the label, the main part
  runs it. The modal offers "Save"/"Create" and "Save and publish"/"Create and publish" (`handleSubmit(publish)`: the saved group is then
  published with `publishAPI.publishFileGroup({file_group_id, acls: null})`, so the grantees of a previous publish are kept and new ones are
  given through the list's Publish action). The data set screens offer "Create" and "Create and publish" (`createActions` in
  `src/components/common/createActions.ts`); the main part of their split button opens `PublishDataSetModal` (`src/components/data/`),
  the data set counterpart of the file publish dialogs: it loads `dataAPI.getDataSetStatus(identifier)` (`GET
  /data-publish/{identifier}/status`; `music_library` = `MUSIC_DATA_SET_IDENTIFIER`, or the identifier derived by
  `fileGroupDatasetToIdentifier`) through `usePublishStatus`, shows `PublishStatusNotice`, prefills the grantees of an existing set into
  the same `PublishAclEditor` and submits always a list (`toPublishAclRequests(rows) ?? []`, an empty list removes every additional
  grantee in the admin backend). Its OK button carries the picked action; `dataAPI.publishMusic(publishToSite, acls)` /
  `publishGpsTimeSeries(id, name, publishToSite, acls)` send `publish_to_site` (the file backend's task also starts the admin backend's
  publishing of the data set to the website) and `acls`. The Jest
  stub of the library (`__mocks__/@vempain/vempain-common-frontend.tsx`) renders the main part as `<testid>-main` and one `<testid>-option-<key>`
  button per action; tests that replace the library with a factory spread `jest.requireActual` of that stub. Tested in
  `src/__tests__/components/files/FileGroups.test.tsx` and `src/__tests__/components/data/*.test.tsx` (`PublishDataSetModal.test.tsx` with
  the editor stub of `src/testUtils/mockAclRowsEditor.tsx`).
- `FileMap` (`src/components/files/FileMap.tsx`, route `/files/map`, menu File management > Map) is the map of the original files with GPS
  coordinates: the `MapView` of `@vempain/vempain-common-frontend` over `mapAPI` (`new MapAPI(apiUrl, '/map')`, the file backend's
  `MapAPI` endpoints, which cluster the readable files on the backend), with the file types that can carry coordinates, the tile server of
  `src/tools/mapConfig.ts`, tag suggestions through `tagAPI.findPageable`, the thumbnail through `FileDisplay` (the map response's thumbnail
  resource, else the file itself) and the details through `FileDetails` (`toFileDetails` turns the signed coordinates back
  into value + hemisphere). The `MapView`/`MapAPI` stubs live in `__mocks__/@vempain/vempain-common-frontend.tsx` (`MAP_STUB_FILE`). Tested
  in `src/__tests__/components/files/FileMap.test.tsx`.
- `DataSets` (`src/components/data/DataSets.tsx`, route `/data/sets`, menu Data Management > Data sets) is the table of the data sets this
  backend created in the admin backend: one `VempainTable` in server mode over `usePagedTable` (`dataAPI.findPageableDataSets`, `POST
  /data-publish/paged`, which the file backend forwards to the admin backend's paged listing; request `DataPagedRequest` with
  `modified_after_publish`, rows the file backend's `DataSetSummaryResponse` as `src/models/responses/DataSummaryResponse.ts`). Default sort `identifier`
  ascending, 25 rows; every column sorts on the backend, identifier/type/description carry the column text filter, the timestamps are
  `searchable: false`; the "Only modified after publish" switch is a dep of the hook. The table is read-only: data sets are created from the
  music and GPS screens. Tested in `src/__tests__/components/data/DataSets.test.tsx` with the reduced paged-table stub of the auth library.
- Publishing a file group (`FileGroups.tsx` publish modal) can grant additional admin-backend users and units privileges on the site
  files and gallery it creates: `PublishAclEditor` (`src/components/files/`) loads the grantable admin users and units with
  `publishAPI.getPublishUsers()`/`getPublishUnits()` (`GET /publish/users` and `/publish/units`, proxied by the file backend from the
  admin backend because the admin and file user bases are separate, never this backend's own users) and renders the shared
  `AclRowsEditor` of `@vempain/vempain-auth-frontend` (the one ACL row editor of all Vempain frontends, also behind the `AclEditor` of
  the user and unit screens) on the `acls` `Form.List` with the row fields `user_id`/`unit_id` and `uniqueGrantees`;
  `toPublishAclRequests()` turns the rows into `PublishAclRequest[]` (exactly one of `user_id`/`unit_id` + the four `*_privilege`
  flags, null when nothing is granted). The row rules ("All" button, read required, delete needs modify, create implies read) live and
  are tested in the auth library, never in a local copy here; `src/__tests__/components/files/PublishAclEditor.test.tsx` covers the
  wrapper with the editor stubbed by `src/testUtils/mockAclRowsEditor.tsx` (`aclRowsEditorMock`, "stub: grant first user" button,
  installed per test with `jest.mock("@vempain/vempain-auth-frontend", ...)`). The publishing service account always keeps every
  privilege; the editor only adds grantees. `publishAPI.publishAllFileGroups(request?)` is a `POST` that carries the same `acls` list.
  Any new shared ACL component, rule or helper this SPA needs is added to `@vempain/vempain-auth-frontend` (the home of all shared ACL
  functionality) and consumed from there, never written here or in `vempain-common-frontend`.
- Both publish dialogs prefill the grantees of the previous publish: when the dialog opens, `usePublishStatus` (`src/components/files/`)
  calls `publishAPI.getFileStatus(fileId)` (`GET /publish/file/{id}/status`, `PublishFileStatusResponse`) or
  `publishAPI.getFileGroupStatus(groupId)` (`GET /publish/file-group/{id}/status`, `PublishFileGroupStatusResponse`: gallery, its
  `site_file_ids`, `acls`), and when `published` it writes the `acls` rows (`PublishedAclResponse`, the shape of `PublishAclRequest`) into
  the `PUBLISH_ACL_FIELD` list of the form, so the shared `AclRowsEditor` shows them and `toPublishAclRequests` sends them again unchanged.
  `PublishStatusNotice` renders the state above the editor (loading, lookup failed = rows start empty but publishing still works, published
  before as site file / gallery with the prefilled hint, not published before). The lookup is repeated on every open and an answer that
  arrives after the dialog closed is dropped. The file backend asks the admin backend, so a deleted site file or gallery answers
  `published=false`. Tested in `PublishFileButton.test.tsx`, `FileGroups.test.tsx` (the editor stub registers the `acls` field so that
  prefilled rows are part of the submitted values), `PublishStatusNotice.test.tsx` and `PublishAPI.test.ts`.
- Every typed file list (`src/components/files/*Files.tsx`) has a publish action next to delete: `PublishFileButton` opens a modal with
  the same `PublishAclEditor`, calls `publishAPI.publishFile({file_id, acls})` (`POST /publish/file`, task type `PUBLISH_FILE`, one
  step) and hands the task to the tray. A single-file publish never creates or links a gallery on the admin side. Tested in
  `src/__tests__/components/files/PublishFileButton.test.tsx` with the services and the task hook mocked.
- Metadata management (`/metadata/list`, Tag management > Metadata, `src/components/metadata/`): `MetadataList` shows every distinct
  metadata group/key/value of the file backend's `metadata` table with its file count (`metadataAPI.findSummaries`, `POST /metadata/paged`,
  filters by group, key and/or value sent as `metadata_group`/`metadata_key`/`metadata_value`; the filters are `deps` of `usePagedTable`
  and `paged.setFilter(undefined, "")` returns to the first page). A row expands into `MetadataFiles` (`metadataAPI.findFiles`,
  `POST /metadata/files/paged`): the readable files carrying the row, always `METADATA_FILES_PAGE_SIZE` (10) at a time, filtered by file
  name and type, sortable by file name, type and size; the file name opens the shared `FileDetails` modal. The Edit action (disabled for
  rows with `writable=false`, the read-only ExifTool groups) opens `MetadataValueEditModal`, which posts
  `MetadataValueUpdateRequest` (`metadataAPI.updateValue`, `POST /metadata/value`, an empty new value removes the entry from the files) and
  hands the `202` task (`METADATA_UPDATE_VALUE`) to the tray with `trackTask`; the list reloads when the task finishes. Row keys come from
  `metadataRowKey` (`src/tools/metadataTools.ts`) because the rows have no id. Tested in `src/__tests__/components/metadata/` and
  `src/__tests__/services/MetadataAPI.test.ts` with the auth-frontend table hook, the services and the task hook mocked.
- Tests live in `src/__tests__/` only (the directory name is plural); Jest config is in `package.json` (`ts-jest` ESM preset) with `jest.setup.ts`
  providing `VITE_APP_API_URL` and the `TextEncoder` polyfill react-router needs. `src/viteEnv.ts` is the only module that reads
  `import.meta.env` (Vite replaces the whole object at build and dev time); Jest maps it to `__mocks__/viteEnv.ts` (`process.env`) and
  excludes it from coverage (`coveragePathIgnorePatterns`), so `resolveApiUrl`, `resolveAdminApiUrl`, `resolveFooterConfig`, `mapConfig`,
  `i18n.ts` and `index.tsx` are real, testable modules. Never add `import.meta` to any other module. Every source file is kept at or
  above 95 % line, statement and function coverage (`yarn jest --coverage`); screens are tested with `react-i18next`, the services, the
  task hook and the auth-frontend table hook mocked, the typed file lists in one parametrized suite (`typedFileLists.test.tsx`).
- Build metadata is generated by `generateBuildInfo.js` into `src/buildInfo.json`; treat the JSON as a derived artifact.
- `.env` is the template; `.env.local` and `.env.prod` are local/deployment files and must not receive secrets.

## Tooling and validation

- Use the checked-in Yarn 4 release (`.yarn/releases`, `yarnPath` in `.yarnrc.yml`); `@vempain/*` packages resolve from GitHub Packages with
  `VEMPAIN_ACTION_TOKEN` configured in `.yarnrc.yml` (no `.npmrc` is needed).
- Run after changes:

```bash
yarn lint
yarn test
yarn build
```

`yarn lint` is type-aware (`parserOptions.projectService`) and fails on `@typescript-eslint/no-deprecated`: any use of functionality that the type declarations
mark `@deprecated` (Ant Design props, DOM or library APIs) must be replaced by the documented successor. CI runs it before the build.

`yarn build` type-checks with `tsc -b`: `tsconfig.json` is a solution file (`files: []` plus references to `tsconfig.app.json`, `tsconfig.node.json`
and `tsconfig.test.json`), which a plain `tsc` accepts without checking a single source, so only the `-b` form fails the build on type errors
(`vite build` alone never does). `tsconfig.app.json` lists the `node` types because the `resolve*` helpers fall back to `process.env` outside Vite.

- CI uses the reusable `frontend-spa.yaml` workflow from `vempain-workflows`.
- Do not commit `dist/`, `coverage/`, `node_modules/` or local environment files.
- Security findings and their mitigations are recorded in `security/OWASP-2025-audit-report.md`; keep it current when changing sanitization,
  URL building or authentication handling.

## Background tasks (non-blocking long actions)

- Long-running backend actions (file group publishing, directory scans, music/GPS data set publishing, tag and metadata rewrites across all files)
  answer `202 TaskAcceptedResponse` instead of blocking. Never show a blocking `Spin`/`loading` state for them: call the API, then
  `trackTask(accepted, {onFinished})` from `useTaskProgress()` of `@vempain/vempain-common-frontend` and tell the user the work started.
- The task tracking lives in the shared `@vempain/vempain-common-frontend` package: `src/services/index.ts` creates
  `taskAPI = new TaskAPI(apiUrl, '/tasks')`, `App.tsx` mounts `<TaskProgressProvider taskAPI={taskAPI}>` and `<TaskProgressTray/>`, and
  `src/models` re-exports `TaskStatusEnum`, `TaskAcceptedResponse` and `TaskProgressResponse` from the package. `TaskProgressProvider`
  polls unfinished tasks every `TASK_POLL_INTERVAL_MS`, restores the user's tasks from `GET /tasks` after a reload, and `TaskProgressTray`
  renders them as a non-blocking stacked tray in the lower right corner. The X of a card only closes that card (`closeTask`: hidden ids are kept in session
  storage, a finished task is also dismissed
  from the backend list); it never stops the task. The Cancel button (`cancelTask`, `POST /tasks/{id}/cancel`) stops a queued or
  running task and reverts the changes it has made; the card then shows CANCELLING and finally CANCELLED with the number of reverted
  changes. A finished task keeps its card with its completion, cancellation or failure message until the user closes it. Type-specific
  results (for example `ScanResponses` of a scan) are delivered to the `onFinished` callback as `TaskProgressResponse<R>.result`, also
  for a card the user closed while the task was running.
- `src/models/TaskTypeEnum.ts` documents the task types of the file backend and their result payloads; the tray texts are the
  `TaskProgress.*` keys of `public/locales/*.json`.
- The provider and tray are tested in `vempain-common-frontend`; here the screens that call `trackTask` are tested with the hook mocked.

## Tag ACL rule

Tags are metadata, not ACL-bearing resources. Tag entities have no ACL information, so tag list, search, and mutation endpoints must not perform ACL checks on
tags. ACL checks apply only to resources that explicitly carry an ACL.
