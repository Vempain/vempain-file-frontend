---
name: add-screen-and-route
description: Add a screen to the Vempain file frontend (component, route in App.tsx, TopBar menu entry, en/fi/sv locale keys, Jest test with the repository's mocks). Use for any new page, list, modal or navigation entry.
---

# Add a screen to vempain-file-frontend

1. Component under `src/components/<feature>/`, exported from that folder's `index.ts` and reachable through `src/components/index.ts`.
2. Route in `src/App.tsx` **and** menu entry in `src/main/TopBar.tsx` (NavLink inside the matching menu group); both files change together.
3. Texts: every string goes through `useTranslation().t("<Screen>.<key>", {defaultValue})`; add the keys to all of `public/locales/en.json`,
   `fi.json`, `sv.json` (same key set in each; files use `"key" : value` spacing and 2-space indent). Menu labels live under
   `TopBar.menu.*`.
4. Server-paged tables: `usePagedTable(fetcher, {defaultPageSize, defaultSortBy, deps})` + `<VempainTable dataMode="server" paged={...}>`
   from `@vempain/vempain-auth-frontend`. The hook supports one column filter; extra filters go in the fetcher and in `deps`, and call
   `paged.setFilter(undefined, "")` to return to page 0. Rows without an id need a `rowKey` function.
5. Reuse the shared pieces: `FileDetails` in an antd `Modal` for file details (pattern in `ImageFiles.tsx`), `PublishFileButton`,
   `fileTypeEnum2Tag`, `formatByteSize`; the management screens come from `@vempain/vempain-auth-frontend`, never copy them.
6. Models in `src/models/{requests,responses}` mirror the backend DTOs in snake_case; no TypeScript `enum`, use `as const` objects.
7. Test in `src/__tests__/components/<feature>/<Screen>.test.tsx`:
    - mock `react-i18next` (`t` returns `defaultValue` or key), `../../../services` (jest.fn per API method), `@vempain/vempain-common-frontend`
      (`useTaskProgress`), and `@vempain/vempain-auth-frontend` with `{virtual: true}` providing a reduced `usePagedTable`/`VempainTable`;
    - mock the `../../../tools` barrel (it imports Vite-only `import.meta` modules) with only the helpers the screen uses;
    - stub `window.matchMedia` and `MessageChannel` for antd; antd buttons with icons have the icon name in their accessible name, match
      with a regex. Assert the requests sent to the mocked API rather than DOM details.
8. Run `yarn lint`, `npx tsc --noEmit -p tsconfig.json`, `yarn test` (see `validate-frontend`) and describe the screen in `AGENTS.md`.
