# vempain-file-frontend — Agent Guide

Use the checked-in Yarn 4 tooling, preserve shared authentication/API
conventions and snake_case contracts, avoid TypeScript enums, and do not commit
generated build output or local environment files. Run focused tests and the
build after changes.

## Background tasks (non-blocking long actions)

- Long-running backend actions (file group publishing, directory scans, music/GPS data set publishing, tag rewrites across all files)
  answer `202 TaskAcceptedResponse` instead of blocking. Never show a blocking `Spin`/`loading` state for them: call the API, then
  `trackTask(accepted, {onFinished})` from `useTaskProgress()` (`src/tasks`) and tell the user the work started.
- `TaskProgressProvider` (in `App.tsx`) polls `taskAPI.getTask` for unfinished tasks every `TASK_POLL_INTERVAL_MS`, restores the
  user's tasks from `GET /tasks` after a reload, and `TaskProgressTray` renders them as a non-blocking stacked tray in the lower right
  corner. The X of a card only closes that card (`closeTask`: hidden ids are kept in session storage, a finished task is also dismissed
  from the backend list); it never stops the task. The Cancel button (`cancelTask`, `POST /tasks/{id}/cancel`) stops a queued or
  running task and reverts the changes it has made; the card then shows CANCELLING and finally CANCELLED with the number of reverted
  changes. A finished task keeps its card with its completion, cancellation or failure message until the user closes it. Type-specific
  results (for example `ScanResponses` of a scan) are delivered to the `onFinished` callback as `TaskProgressResponse<R>.result`, also
  for a card the user closed while the task was running.
- Models: `TaskStatusEnum`, `TaskTypeEnum`, `TaskAcceptedResponse`, `TaskProgressResponse<R>`; client: `services/TaskAPI.ts` (`taskAPI`).
  Keep `src/tasks` free of file-specific logic; it is meant to move into the shared frontend package together with the backend facility.
- Tests: `src/__tests__/tasks/TaskProgress.test.tsx` (provider + tray, fake timers) and `src/__tests__/services/TaskAPI.test.ts`.

## Tag ACL rule

Tags are metadata, not ACL-bearing resources. Tag entities have no ACL information, so tag list, search, and mutation endpoints must not perform ACL checks on
tags. ACL checks apply only to resources that explicitly carry an ACL.
