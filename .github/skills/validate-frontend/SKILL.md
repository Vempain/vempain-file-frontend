---
name: validate-frontend
description: Install, lint, typecheck, test and build the file frontend with the checked-in Yarn 4 and GitHub Packages access, and keep generated files out of the diff. Use before reporting any change as done.
---

# Validate vempain-file-frontend

- Use the checked-in Yarn release (`yarnPath` in `.yarnrc.yml`). `@vempain/*` packages come from GitHub Packages:
  `export VEMPAIN_ACTION_TOKEN=<GitHub PAT with read:packages>` then `yarn install --immutable`. Yarn rewrites `package.json` spacing and
  `.yarn/install-state.gz`; restore them if they show up in `git status`.
- Checks, all must be clean (lint allows zero warnings; `react-refresh/only-export-components` means a non-component export belongs in
  `src/tools/`):
  ```bash
  yarn lint
  npx tsc --noEmit -p tsconfig.json
  yarn test
  yarn build
  ```
- `yarn build` runs `generateBuildInfo.js` and rewrites `src/buildInfo.json`; it is a derived artifact, do not commit the change
  (`git checkout -- src/buildInfo.json`) and remove `dist/`.
- Jest (ts-jest ESM preset, jsdom, `jest.setup.ts`): tests live only in `src/__tests__/` mirroring `src/`; `resolveApiUrl` and
  `resolveAdminApiUrl` are mapped to `__mocks__/`; `@vempain/vempain-auth-frontend` is mocked with `{virtual: true}`; modules using
  `import.meta` (the `src/tools` barrel through `mapConfig.ts`) must be mocked in component tests. Run one file with
  `yarn jest src/__tests__/<path>`.
- Locale files `public/locales/{en,fi,sv}.json` must share the same key set; check parity when adding keys.
- Report the numbers (suites, tests) from the output; never commit `dist/`, `coverage/`, `node_modules/` or `.env.local`/`.env.prod`.
