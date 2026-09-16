# OWASP Top 10:2025 audit — Vempain File frontend

Date: 2026-09-15 · Scope: `vempain-file-frontend/` plus the File API
authentication boundary · Method: source/configuration review, dependency
inventory, and targeted Jest regression coverage.

## Executive summary

The browser trusts the File API for authorization; React routes and menu
visibility are not security controls. One HIGH frontend issue was fixed:
deployment-controlled footer values were inserted with
`dangerouslySetInnerHTML`, allowing a compromised build environment to inject
scriptable markup. Footer values are now rendered as text and the shipped
environment values no longer contain HTML.

The backend was not modified per task instructions. The backend review found a
residual HIGH risk: authenticated non-admin users can reach
`GET /location/{id}` and `GET /location/guard/**` according to
`vempain-file-backend/service/.../WebSecurityConfig.java`; ownership/role
enforcement must be fixed and tested in the backend repository.

## Inventory and trust boundaries

| Asset                            | Evidence                                                                                               |
|----------------------------------|--------------------------------------------------------------------------------------------------------|
| React/Vite SPA and static assets | `src/index.tsx`, `vite.config.ts`, `package.json`                                                      |
| Browser → File API               | API clients in `src/services/index.ts`: files, groups, tags, scan, location, publish, data, statistics |
| Browser → Admin API              | `AdminAclAPI`, `AdminScheduleAPI`, `AdminUnitAPI`, `AdminUserAPI` via `VITE_APP_ADMIN_API_URL`         |
| Sensitive data                   | file metadata/content, GPS locations/guards, credentials/tokens, publish data                          |
| Build/runtime configuration      | `.env`, `.env.local`, `.env.prod`; `yarn.lock`; Vite compile-time `VITE_*` values                      |

An anonymous caller can load the SPA but should receive API `401`; a
low-privilege authenticated caller is subject to backend authorization. A
stolen bearer token has the API permissions of its subject until expiry or
revocation; frontend route visibility cannot reduce that risk.

## A01–A10 coverage matrix

| Category                               | Verdict                           | Evidence / checklist coverage                                                                                                                                                                                       |
|----------------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A01 Broken Access Control              | **FAIL (residual backend)**       | Frontend uses shared auth API clients, but route/menu checks are UX only. Backend GPS endpoints require explicit role/object authorization; see residual F-02.                                                      |
| A02 Security Misconfiguration          | **PASS / UNVERIFIED**             | No secrets found in `VITE_*` values; Vite has no proxy or mock production configuration. Production header/CSP and served-file checks require deployment verification.                                              |
| A03 Software Supply Chain Failures     | **UNVERIFIED**                    | `yarn.lock` is committed and package versions are declared; `yarn npm audit` could not authenticate to GitHub Packages. CI immutable install, scripts policy, SBOM, and registry policy need pipeline verification. |
| A04 Cryptographic Failures             | **PASS at frontend boundary**     | No cryptography or credential storage implemented in this SPA; auth/session handling is delegated to `@vempain/vempain-auth-frontend`. TLS/cookie settings require backend/deployment verification.                 |
| A05 Injection                          | **FIXED (F-01)**                  | Removed `dangerouslySetInnerHTML` from `src/main/BottomFooter.tsx`; configured footer values are text nodes. API query/body encoding is delegated to Axios and typed service methods.                               |
| A06 Insecure Design                    | **PASS / residual**               | Backend remains the authorization source of truth; no client-only authorization claim is treated as enforcement. GPS privacy design remains a backend responsibility.                                               |
| A07 Authentication Failures            | **UNVERIFIED at shared boundary** | `SessionProvider` and shared interceptor are used in `src/index.tsx`; token lifetime, logout invalidation, MFA, and rate limiting require shared-auth/backend tests.                                                |
| A08 Software/Data Integrity Failures   | **UNVERIFIED**                    | Lockfile is present; no runtime HTML or dynamic code loading remains in the reviewed frontend path. CI provenance, action pinning, and artifact signing require workflow verification.                              |
| A09 Logging & Alerting Failures        | **UNVERIFIED / backend-owned**    | SPA has no security event sink. API access-denied logging and alerting must be verified in the backend/observability stack.                                                                                         |
| A10 Mishandling Exceptional Conditions | **PASS / UNVERIFIED**             | Shared API interceptor handles session expiry; component calls generally use promise rejection handlers. Production error-boundary and repeated-error aggregation were not evidenced.                               |

## Findings and fixes

### [HIGH] F-01 — Build-configured footer HTML execution · A05:2025 · CWE-79

**Reproduction:** `BottomFooter.tsx` concatenated `VITE_APP_*` values and
translation/build metadata into `dangerouslySetInnerHTML`. A malicious or
compromised build environment could set a footer value to an event handler,
scriptable URL, or other active markup; Vite embeds these values in the public
bundle.

**Fix:** Render each value as a React text node and change `.env`,
`.env.local`, and `.env.prod` to plain text. Regression test:
`src/__tests__/components/BottomFooter.test.tsx`.

### [HIGH] F-02 — GPS location authorization parity · A01:2025 · CWE-639

**Status:** Deferred; backend source was explicitly out of scope for edits.
`LocationAPI.ts` exposes location and guard calls, while the backend security
configuration reportedly leaves these paths at authenticated-only access.
Backend must add role/ownership enforcement and REST tests for anonymous `401`,
wrong role/user `403`, and authorized `200`. Track the implementation in the
backend report and cross-link it here.

## Accepted risks and deferred recommendations

- Frontend cannot enforce IDOR, GPS privacy, CSRF, token invalidation, rate
  limits, or API security headers; these remain backend/shared-auth controls.
- Run the dependency audit with registry credentials, add an SBOM/provenance
  step if absent, and verify production headers and static-root contents.
- Add a production React error boundary and centralized privacy-preserving
  error reporting after the backend authorization remediation.

## Verification

- `yarn build`: passed (TypeScript and Vite production bundle).
- `yarn lint`: attempted; current dependency state reports TypeScript 7
  incompatibility with installed `typescript-eslint`.
- `yarn test`: attempted; current `ts-jest` does not support the installed
  TypeScript 7 compiler API. This is pre-existing dependency/worktree state (`package.json`, `yarn.lock`, `.yarn/install-state.gz`) and was preserved.
- `yarn npm audit --all --recursive`: unavailable because GitHub Packages
  authentication was not configured.
