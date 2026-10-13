---
name: track-background-task
description: Call a file backend endpoint that answers 202 with a background task and show its progress in the task tray instead of a blocking spinner. Use for publishing, scanning, tag or metadata rewrites and any long operation.
---

# Track a background task in vempain-file-frontend

- Long-running backend actions answer `202 TaskAcceptedResponse`; never show a blocking `Spin`/`loading` for them.
- In the screen: `const {trackTask} = useTaskProgress()` from `@vempain/vempain-common-frontend`; after the API call
  `trackTask(accepted, {onFinished: () => reload()})`, then `message.success(...)` telling the user the work started and where to follow it (lower right
  corner). Close the modal and reset the form.
- The provider and tray are mounted once in `App.tsx` (`<TaskProgressProvider taskAPI={taskAPI}>`, `<TaskProgressTray/>`); the tray polls,
  restores tasks after a reload, X closes a card only, Cancel stops and reverts the task. Result payloads arrive in `onFinished` as
  `TaskProgressResponse<R>.result` (for example `ScanResponses`).
- Add new task types to `src/models/TaskTypeEnum.ts` with a comment on the result payload; tray texts are the `TaskProgress.*` keys of
  `public/locales/*.json`.
- Tests mock `@vempain/vempain-common-frontend` as `{useTaskProgress: () => ({trackTask})}` and assert
  `trackTask` was called with the accepted task and an `onFinished` function (`PublishFileButton.test.tsx`, `MetadataList.test.tsx`).
