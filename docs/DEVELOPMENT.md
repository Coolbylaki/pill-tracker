# Development workflow

## Environment inventory (2026-10-09)

- Windows; project directory: C:\Projects\Pill Tracker.
- Git 2.54.0 is installed and has an existing author identity.
- Node.js 26.1.0 and npm 11.13.0 are installed.
- GitHub CLI 2.102.0 is installed and authenticated. Private repository: https://github.com/Coolbylaki/pill-tracker. The main branch tracks origin/main; preparation commits have been pushed.
- Android Studio is not installed, according to the user.
- User has a current Android phone and a GitHub account.

Before scaffolding, check the selected Expo SDK's Node support. Prefer a supported Node LTS version if needed without replacing the user's existing runtime unnecessarily.

## Working loop

1. State the milestone and what the user will be able to inspect.
2. Make focused changes and explain unfamiliar React Native or Android concepts when they arise.
3. Verify behavior appropriately. Documentation-only changes need review, not app tests.
4. Review the diff and ensure no credentials, private health data, or generated build artifacts are staged.
5. Commit a coherent change with a clear message. Fixes receive their own commits rather than hiding prior work.
6. Push completed checkpoints to the private GitHub repository once authenticated.
7. Summarize what changed, verification, and the next milestone.

Use main initially; use branches when a change benefits from isolated review. Do not rewrite published history or force-push by default.

## Device and build setup

Use a physical Android development build for meaningful notification tests. Expo Go may be used for early UI exploration, but it is not the release validation environment. Cloud Android builds can avoid requiring Android Studio initially. An Expo account may be required for that workflow; sign-in is performed by the user.

Use accelerated reminder times during testing, then verify real daily timing. Cloud build quotas and account requirements should be checked when choosing a build service.

## Security and repository hygiene

- Keep the GitHub repository private.
- Never commit tokens, .env files, signing keys, ad credentials, or personal database files.
- Keep release signing material outside the repository and plan safe backup before public release.
- Add the app lockfile once dependencies exist.
- Select app identifiers and public developer identity before creating store-bound builds.

## Reference documentation

- Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
- Expo notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Android alarms: https://developer.android.com/develop/background-work/services/alarms
- Google Play policies: https://support.google.com/googleplay/android-developer/answer/18258653

Check current requirements at the implementation and release milestones.

## App scaffold and tooling

- Expo SDK 57, React Native 0.86, React 19, TypeScript 6; generated with the official blank-typescript template.
- Strict TypeScript is enabled. The minimal template has no navigation or lint setup.
- ESLint uses Expo's flat configuration. Prettier runs independently; eslint-config-prettier prevents conflicts.
- Node.js 24 LTS is recommended and used in CI; Node.js 26.1.0 is the current local runtime and meets the dependency engine requirement.
- Use `npm run check` before committing. Use `npm run format` to apply formatting.
- VS Code extension recommendations are included. In VS Code, select Prettier as the formatter and enable format-on-save if desired.
- On 2026-10-09, the user confirmed that Expo Go connects successfully and displays the initial screen on their Android phone. This verifies the starter UI workflow. A standalone development build and reminder delivery have not yet been tested.

## Known dependency follow-up

The initial official scaffold's npm audit reported 22 affected dependency entries (15 high, 7 moderate), propagated through Expo and React Native tooling. The underlying findings include braces, node-forge, and uuid. The suggested force fix downgrades the app to older incompatible Expo/React Native versions, so it was not applied. Track compatible upstream patches and reassess before any distributed release; do not treat the current audit as clean. The initial scaffold passed TypeScript, Expo dependency compatibility, and Android bundle export checks.

## First home screen and daily recording

Implemented on 2026-10-09:

- Dark home screen, safe areas, scroll support, current local date, confirmation dialog, saved timestamp, and undo with confirmation.
- SQLite schema version 1 stores one record per local day. Repeated confirmations preserve the first timestamp. Undo checks both date and timestamp.
- Refresh status after foregrounding and when the local day changes. A dialog spanning midnight cannot silently confirm the wrong date.
- Database failures offer retry and do not display a successful confirmation unless the stored record is read back.
- Tests execute the application's repository against real SQLite using Node's built-in SQLite driver. They verify reopening, duplicate prevention, undo isolation, local date boundaries, different time zones, and rejecting future schema versions.
- TypeScript allows explicit .ts imports so the repository can run in Node's test runner as well as Metro.
- Basic daily-recording behavior was verified by the user on their Android phone through Expo Go on 2026-10-09. Larger-font layout, real midnight transitions, and standalone development-build behavior remain separate checks.

### Phone verification for this checkpoint

1. Reload Expo Go if Fast Refresh has not shown the new screen. Check that the dark home screen fits below the status bar and above the navigation area.
2. Tap the main button, then cancel: the day remains unrecorded.
3. Confirm after taking pills, or use the undo flow immediately after a test confirmation: the screen shows the recorded time and disables duplicate confirmation.
4. Reload and reopen the app: the confirmed state should remain.
5. Cancel the undo dialog: the confirmed state remains. Confirm undo: the button becomes available again.
6. Check scrolling and text when using a larger phone font size.

Calendar, notification scheduling/cancellation, theme settings, and backups are separate checkpoints. These tests do not verify reminder delivery.

### Reported phone results (2026-10-09)

- Confirmation followed by reload: confirmed state persisted.
- Undo followed by reload: unrecorded state persisted.
- Canceling the pill confirmation followed by reload: state remained correct.
- Closing and reopening Expo Go after confirmation: confirmed state persisted.

The basic home-screen/daily-recording checkpoint is complete. These results do not establish reminder reliability or standalone-build behavior.
