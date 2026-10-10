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

## Monthly calendar checkpoint

Implemented on 2026-10-09:

- A Monday-first calendar below the confirmation card shows saved ticks, an outline for today, neutral unrecorded dates, and subdued future dates.
- Previous/next month navigation and a return-to-current-month action. The default view follows the current month when the local date changes; deliberate navigation is preserved.
- Monthly records are read from SQLite using inclusive start and exclusive end boundaries. No schema migration or synthetic user history is needed.
- Confirmation, undo, and foreground refresh cause history to reload. Loading and errors are shown explicitly; failed queries do not appear as empty history. Results from superseded month requests are ignored.
- Nine automated tests pass, including leap years, six-row grids, weekday alignment, year boundaries, and monthly queries that reflect undo.
- This checkpoint displays history only. Editing past dates and reminder behavior remain separate work.

### Calendar phone verification checklist

1. Scroll below the confirmation button and check today's outline and recorded tick, if confirmed.
2. Confirm and undo today: the calendar tick and monthly count should update with the main card.
3. Navigate backward and forward, including December/January, then use Back to this month.
4. Reload or reopen: history should persist. The initial month is the current month after reopening.
5. Check that weekdays, dates, and navigation fit on the phone. Future dates should have no recorded ticks.

### Reported calendar results (2026-10-09)

- The user reported that the calendar flow works after trying the confirmation/undo, navigation, and reload checks.
- December/January navigation changes the year correctly in both directions.
- March 2026 displays all 31 dates across six rows without clipping.

The calendar display checkpoint is complete. Past-date editing and reminder verification remain separate checkpoints.

## Date correction checkpoint

Implemented on 2026-10-09:

- Tap an unrecorded past date to mark it taken, or a recorded date to remove its record. Both actions require confirmation showing the selected date.
- Future dates are disabled; storage validation also rejects invalid and future dates for correction operations.
- Today's calendar cell uses the existing daily confirmation/undo flow and refreshes the main card. Past-date changes leave today's status intact.
- Writes share the daily recording lock. Calendar history refreshes after corrections, and removing a record checks its recorded timestamp to avoid deleting a newer replacement.
- Database schema version 2 separates nullable taking time from recording time. Past-day additions have an unknown taking time and store when the correction was recorded. Existing schema-version-1 records migrate with dates and taking times preserved.
- Twelve automated tests pass, including schema migration, correction persistence after reopening, day isolation, and future/invalid-date rejection.

### Date-correction phone verification checklist

Press r in the running Expo terminal for a full reload so the database migration initializes. No server restart or data clearing is needed.

1. Verify previously saved ticks and today's status are still present.
2. Tap an unrecorded past day and cancel: it remains unchanged. Confirm the addition: the tick and count update; today's card is unchanged.
3. Reload: the correction persists. Tap that recorded date and cancel removal: it stays recorded. Confirm removal: its tick disappears.
4. Tap a future date: no edit dialog opens.
5. Edit today from the calendar: the main card and calendar agree. Undo any artificial test records afterward.

Reminder delivery and development-build verification remain separate checkpoints.

### Reported date-correction results (2026-10-09)

The user reported that all requested checks passed: existing records survived the update, canceling additions/removals left records unchanged, confirmed corrections persisted after reload, future dates did not open an editor, and editing today kept the calendar and main card synchronized.

The date-correction checkpoint is complete. Reminder feasibility and development-build testing are next.

## Reminder feasibility preparation

Prepared on 2026-10-09:

- Expo cloud project linked under coolbylaki. EAS CLI 24.12.1 is pinned in build scripts and eas.json; it is invoked on demand rather than installed as an app dependency.
- Separate Dev and standalone Test APK profiles, with their own identifiers/databases. Release identifiers and marketplace builds remain unconfigured.
- Native local notifications, notification channel/permission handling, exact-alarm manifest permission, and explicit config plugins.
- Debug/test-only panel schedules 30s/90s pairs now or tomorrow, lists pending counts, simulates today's cancellation, and cancels all owned tests. No remote push tokens or messaging services are used.
- Actual daily confirmation cancels matching test reminders after the pill record is saved; cancellation failure does not misreport the record as unsaved.
- Sixteen automated tests pass; Expo Doctor passed all 21 checks after final plugin configuration. Android bundle generation passed. The inherited npm audit remains 22 affected dependency entries after removing EAS CLI from app dependencies.
- Detailed phone checks and architectural limitations are in REMINDER_TESTING.md. Short reminder delivery and cancellation passed the reported phone checks below. Production scheduling remains unverified.

### Android cloud-build results (2026-10-09)

Both APKs completed successfully from commit `63aad66e8408a9b2e31d7ec040ca76b24496cd15`:

- [Development APK](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/6d2186fe-e615-4126-9a62-167e274dff81): live development client, package `com.coolbylaki.pilltracker.dev`.
- [Standalone reminder-test APK](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/7c8fee0e-d9f7-4257-b6ca-94118f2249cf): server-independent test app, package `com.coolbylaki.pilltracker.test`.
- GitHub Actions passed for the source commit. The initial cloud submission returned a temporary HTTP 503; the retry succeeded without source changes.

Cloud compilation and APK generation are verified. Installation and short notification delivery on the physical phone passed the reported checks below; follow REMINDER_TESTING.md for the remaining overnight and reboot checks. These builds do not enable the production one-hour/six-hour schedule.

### Reported reminder phone results (2026-10-09)

The user tested the standalone Pill Tracker Test APK and reported:

- Both 30-second and 90-second notifications arrived with the phone on.
- Both notifications arrived with the phone locked, including after swiping the app away from Recents.
- Both notifications could remain visible together.
- Simulating today's confirmation prevented both of today's notifications; the user waited through the 90-second test window.
- With today's and tomorrow's pairs scheduled, simulating today's confirmation canceled 2 notifications and left 2 pending. This matches the expected date-scoped cancellation; the count alone does not identify the remaining dates or prove next-day delivery.
- Canceling all test notifications left 0 pending.

The short delivery and simulated cancellation checkpoint is complete. Overnight delivery, reboot restoration, and cancellation through the actual daily confirmation button remain unverified. The production preferred-time schedule and indefinite daily scheduling still require implementation and separate validation.

## First-launch setup and Settings checkpoint (2026-10-09)

- Three-step first launch: choose dark/light appearance, daily pill time (08:00 preselected), and permissions. Permission requests are user initiated; setup can finish with access denied.
- Preferences persist in a separate singleton SQLite table alongside existing pill history. Missing preferences trigger setup without clearing records; invalid saves leave saved preferences unchanged.
- Settings from the home screen edits appearance, pill time, reminders toggle, and optional delays. Defaults are first +1 hour and critical +6 hours. Theme previews immediately; Cancel and Android Back discard drafts and restore the saved theme.
- Native Android time picker, notification access status refreshed on return, and a link to Android Alarms & reminders. Exact-alarm grant status is not queried in this checkpoint; the instructions do not claim that access is granted.
- Home, calendar, test panel, setup, and Settings share dark/light palettes. Setup completion is stored only after Finish setup succeeds.
- Pure routine planning excludes passed times, suppresses confirmed days and disabled reminders, and retains the originating routine date across midnight. Planning is tested; production native scheduling is a separate checkpoint and is visibly inactive in this test version.
- The Expo-compatible time picker adds one npm audit entry via its Expo peer dependency; the inherited tooling advisories now total 23 (7 moderate, 16 high). No additional advisory originates in the time picker itself. Automated fixes propose incompatible Expo/React Native downgrades.

### Setup and Settings phone checklist

Install the updated Test APK over the existing Test app to preserve its history. Since the previous version had no saved preferences, setup should appear once after this update.

1. Choose Light and check that setup changes immediately. Set a pill time, navigate Back, and confirm the draft remains.
2. Finish setup. Home and calendar use the chosen appearance and show the chosen pill time. Existing records remain present.
3. Reopen the app: setup does not repeat, and the theme/time persist.
4. Open Settings, change theme/time, then Cancel or press Android Back: saved values remain. Repeat and Save: changes persist after reopening.
5. Try optional delays and Restore defaults. Invalid or reversed delays should block saving. Evening times display next-day reminder previews.
6. Permission controls should open Android settings. On return, notification status refreshes. Denied permissions must not block setup or pill recording.

Daily reminders are not scheduled by this checkpoint. The existing short reminder test remains available; do not treat its independent delivery controls as the production schedule.

Validation: ESLint, strict TypeScript, Prettier, all 21 automated tests, all 21 Expo Doctor checks, and the Android bundle export passed. Physical-phone setup verification remains pending.

### Setup APK results (2026-10-09)

Both updated Android APKs completed successfully from commit `3d52c015db120603512b9ed4124c886dd221ef8c`. GitHub Actions also passed for that commit.

- [Install updated Pill Tracker Test](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/c7b6fee6-1985-4c3c-8b6c-41b930050d75): standalone setup/Settings phone checks, no development server needed.
- [Install updated Pill Tracker Dev](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/2abefe88-57ef-4aa3-99e1-a55491510ee0): native time-picker support for live development.

Install over the matching existing app to preserve its database. Existing users see setup once because the older app had no preferences row. Physical-phone setup and Settings results remain pending; the checklist above is the next review step. Production reminders remain inactive.

### Reported setup and Settings phone results (2026-10-09)

The user installed the updated standalone Test APK and reported that setup works, existing history remains, saved choices survive reopening, Cancel discards changes, and Save persists changes. The setup and Settings phone checkpoint is complete.

The 30s/90s delivery-test controls intentionally ignore the reminders toggle; the toggle governs the daily routine schedule. This distinction was explained to the user before starting production reminder integration.

## Daily reminder integration (2026-10-09)

- Local Expo Android module `pill-reminders` checks the existing SQLite preferences and pill records before notifying, and renews dated alarms without opening React Native. No login or network service is introduced.
- First +1 hour and critical +6 hours follow saved pill time by default. Optional delay overrides and the reminders toggle are applied on Save. Confirmation, undo, date corrections, startup, foreground, local-day rollover, boot, app replacement, and clock/time-zone/access changes reconcile future alarms.
- A native delivery ledger enforces at most two reminder slots for each routine day even after settings changes or undo. Passed times are not newly scheduled; original routine dates survive midnight. Clock/settings changes invalidate stale intents.
- Native exact-alarm access is queried and Settings opens the permission page for this app. Inexact scheduling is used without access. Dated next-reminder status is shown on Home and in Settings.
- Notification taps identify the associated routine day for review and an explicit confirmation. They never silently write pill records.
- Daily notifications are separate from the independent 30s/90s tests, which remain explicitly labeled as ignoring the Settings toggle.
- Twenty-two JavaScript tests and all Expo Doctor checks passed during integration. Seven native Kotlin planner tests cover late setup, confirm/undo, disabled reminders, midnight/year boundaries, stale/duplicate delivery, DST/time zones, and consecutive-day renewal. Both EAS profiles run these native tests as required build tasks; their results remain pending until the builds finish.
- Detailed accelerated, overnight, and reboot phone checks and operational limits are documented in DAILY_REMINDER_TESTING.md. Real-schedule physical-phone results remain pending.

Foreground display refinement: the app reads native schedule status every 15 seconds while active, without rescheduling alarms. This keeps next-reminder dates current after delivery while the screen stays open. Responses superseded by a new reconciliation request are ignored.

### Daily-reminder APK results (2026-10-09)

The standalone Android update completed from commit `7303531`, including the foreground status refresh. The development APK completed from `55248a4` with the same native scheduler; it loads current JavaScript through the development server.

- [Install updated Pill Tracker Test](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/ab59f63e-6666-4604-b27e-de1074938b7f): standalone app with the real daily schedule.
- [Install updated Pill Tracker Dev](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/617d9e04-5737-4aaf-9518-aad99f12384e): live development with the native scheduler included.
- All 7 Kotlin planner tests passed in both release and debug builds (0 failures). All 22 JavaScript tests, lint, TypeScript, formatting, Expo Doctor, Android bundle export, and GitHub Actions passed for this checkpoint.

Install over the matching existing app to preserve history and settings. Open once to reconcile alarms. Real daily-reminder delivery, overnight renewal, reboot restoration, and notification review still require the phone checks in DAILY_REMINDER_TESTING.md; they are not claimed as physically verified by these builds.

## Reported daily-schedule issues and shared storage repair (2026-10-09)

The user reported preserved history and allowed permissions, but saved theme, delay overrides, and the reminders toggle reverted after reopening. The home schedule did not reflect the edited toggle/delay; Undo kept tomorrow's date. They confirmed pressing Save and returning to Home automatically. The Undo test's phone time remains unknown, so an expired reminder cannot yet be distinguished from the storage fault.

Investigation found that Expo's bundled SQLite engine and Android's framework SQLite engine were opening the same WAL database in one process, with the scheduler not requesting WAL. This was an integration defect and a plausible cause of the stale persistence; the exact failure on the physical phone has not been reproduced locally.

The installed Android app now routes repository queries/writes and reminder reads through one framework SQLite engine, with WAL explicitly enabled. It reuses the existing file, tables, and schema versions; no history/settings reset is performed. Expo Go keeps its separate Expo SQLite fallback. Older development APKs must be updated because the new storage bridge is required.

Save verifies all preferences with a fresh read before returning to Home. Settings labels distinguish the edit preview from the saved daily schedule. Permission statuses use prominent bordered backgrounds and stronger text. General permission-navigation improvements remain a later checkpoint.

New checks cover an existing settings row changed to light mode, reminders disabled, and a five-hour critical delay across reopening; failed read-back detection; bridge batch/binding behavior; native schedule reconciliation after settings updates and Undo; WAL preservation and failed-migration rollback. JavaScript checks passed (26 tests). Three Android database/scheduler integration tests run with Robolectric's native SQLite mode alongside the seven planner tests; cloud/native and physical-phone verification are pending until recorded below.

### Shared-storage repair APK results (2026-10-09)

Both APKs built successfully from `fcd3779`, with all 10 required Android tests passing (7 planner tests plus 3 native SQLite/scheduler integration tests, 0 failures). All 26 JavaScript tests, lint, TypeScript, formatting, and GitHub Actions passed. An initial standalone attempt failed before compilation due to Expo's temporary credential-service network error; its retry succeeded.

- [Install repaired Pill Tracker Test](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/37a221a3-b7cf-4dfb-85d1-171c605ae795): standalone, no server required.
- [Install repaired Pill Tracker Dev](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/d4234c7f-43ff-408e-8dbb-fabdfdaf1178): required native storage bridge for live development.

Install over the matching existing app and open once; keep its data. The reported physical-phone persistence and Undo cases still require the saved-settings regression checklist. Automated tests do not establish that the physical-phone report is resolved, or prove overnight/reboot delivery.

### Reported shared-storage repair phone results (2026-10-09)

The user tested the repaired standalone Test APK from `fcd3779` and reported all four regressions passed:

- Light theme remained selected after saving and reopening.
- A five-hour critical delay persisted and correctly changed the home screen's upcoming time.
- Reminders off persisted after saving and reopening; the home screen reflected the disabled schedule.
- Undo immediately restored today's critical reminder while the first remained tomorrow because today's first time had already passed.

The reported settings-persistence and Undo checkpoint is complete. These checks establish saved preferences and schedule reconciliation on the phone, not actual daily notification delivery. Accelerated real-schedule delivery, notification review/cancellation, locked/swiped-away delivery, overnight renewal, and reboot restoration remain pending. Permission navigation improvements are a separate follow-up discussed with the user.

### Reported accelerated daily delivery and permission styling preference (2026-10-09)

The user reported all three accelerated daily-schedule checks passed: temporary 3-minute/6-minute settings, the expected upcoming times, and both notifications with the app swiped away and phone locked. Exact arrival timestamps were not supplied. This verifies accelerated real-schedule delivery on this phone; notification review/cancellation, overnight renewal, and reboot restoration remain pending.

The user requested reverting the two permission status messages to their previous subtle presentation. Both notification access and Alarms & reminders access now use the original muted body-text style in setup and Settings. Status wording, permission navigation, and scheduler behavior are unchanged. This JavaScript-only visual change requires a new standalone APK to appear in the installed Test app; the existing repaired Dev APK supports it through the development server.

### Handover: notification review and next phone checkpoint (2026-10-09)

The user reported a successful real daily-notification review on another phone: tapping the notification opened the correct routine date without recording pills. **Review this routine** opened the confirmation dialog; pressing Yes updated Home and the calendar. This completes the reported notification review/confirmation flow, but does not establish cancellation of a future critical reminder after the first reminder.

Both October 9 daily reminder slots were used during accelerated testing. Delivered slots remain consumed after Undo or settings changes; further daily-delivery checks on that phone need a future unconfirmed routine date. The separate repeatable 30s/90s test panel does not exercise the real daily notification's date-review flow.

The next planned check is the night of October 9–10, Europe/Belgrade: temporarily save pill time 00:00 with the default +1-hour/+6-hour delays, verify Home shows October 10 at 01:00 and 06:00, reboot and unlock once, then leave the app closed overnight. Restore normal settings afterward. The test is planned only; wait for the user's actual arrival results before claiming overnight renewal or reboot delivery passed.

Permission navigation remains a phone-review item. The native code already targets this app's exact-alarm page, but the user previously saw broad Android settings pages. Normal daily use, final branding, removal of Test labeling and the test panel, and a data-preserving personal-release transition remain later checkpoints. The latest standalone APK still contains `fcd3779`; no new standalone build has been made for the subtle permission styling in `7ce244c`.

### Reported overnight and reboot results (2026-10-10)

The user reported that both the overnight and reboot checks passed, following the October 9–10 test plan recorded above. Overnight delivery and reboot restoration are now marked passed based on this physical-phone report. Exact arrival timestamps were not supplied; the planned 01:00 and 06:00 times are not recorded as measured arrival times.

Confirmation after the first reminder preventing the critical notification and permission navigation remain pending. Continue with normal daily use and restore usual settings after temporary testing; do not delay taking pills, erase real history, or reset delivered reminder slots to create another test.

### Reported confirmation-between-reminders result (2026-10-10)

The user clarified that they had already checked cancellation through the real daily notification: the first reminder arrived, they opened its notification and recorded taking the pill through that flow, and the critical reminder did not arrive. Confirmation after the first reminder preventing the critical notification is now marked passed based on this physical-phone report. The date of the test and exact reminder/confirmation timestamps were not supplied; October 10 is the report date.

Permission navigation remains the outstanding focused phone review. The normal daily-use trial, final branding, removal of Test labeling and the test panel, and a data-preserving personal-release transition remain ahead.

### Reported exact-alarm permission navigation result (2026-10-10)

The user confirmed that the Alarms & reminders option opens this app's alarm toggle directly, and that they had already checked it on the phone. This resolves the pending exact-alarm navigation review based on the physical-phone report. This report concerns the alarm settings destination; it does not add a separate notification-permission navigation result.

The focused reminder checks tracked at handover are now reported passed: accelerated daily delivery, notification date review and confirmation, cancellation after the first reminder, overnight delivery, reboot restoration, and direct exact-alarm settings navigation. Normal daily use remains the next checkpoint, followed by final branding, removal of Test labeling and the test panel, and a data-preserving transition to the ad-free personal release.

## Personal-release preparation (2026-10-10)

The user accepted the completed overnight cycle and checks on both phones as sufficient to proceed, explicitly declining another 24-hour wait. The normal daily-use trial is not an additional gate. They retained the name Pill Tracker, requested a pill-themed icon, and approved the icon.

A standalone `personal` EAS profile now removes Test from the visible app name and disables the delivery-test controls even if a test flag is accidentally inherited. It retains the existing Test package and notification scheme, uses version code 2 (the repaired APK metadata confirms code 1), and relies on the existing package signing credentials for an in-place update. Pill history, settings, delivery ledger, SQLite engine, and schema are unchanged. Startup removes only leftover delivery-test notifications, with a retry if cleanup fails; ordinary confirmation in the personal app no longer offers an error referring to the hidden test panel. Subtle permission-status text is included.

The built-in ImageGen tool produced the approved mint/ivory capsule with a dark teal tick. Both final assets are saved in the repository. The adaptive foreground has real transparency and fits within the central Android safe region; the square launcher asset is opaque. See PERSONAL_RELEASE.md for installation and branding details and BRANDING_PROMPTS.md for the exact prompts.

Validation before packaging: lint, TypeScript, formatting, and all 27 JavaScript tests passed, including the new build-identity/flags/version regression. Resolved Expo personal configuration and the Android Hermes bundle export passed. The initial local export hit a sandbox temporary-file permission error; the same export succeeded with normal temporary-directory access. The personal cloud build will run the existing 10 native Android tests before APK packaging; its result and the in-place phone update are not yet claimed passed.

### First personal APK result (2026-10-10)

The [standalone personal APK](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/c249e98b-0b28-432f-89f3-96fe4e185319) finished successfully from `37860ce`. EAS used the existing Test package's default remote keystore; final metadata confirms `com.coolbylaki.pilltracker.test`, version code 2, and the personal profile. All 10 native tests passed (0 failures), and Android packaging completed. Local code checks and all 27 JavaScript tests, resolved Expo config, Android Hermes export, and GitHub Actions also passed.

The APK includes the approved icon, visible Pill Tracker name, no delivery-test panel, and the subtle permission styling. Install over Pill Tracker Test and open once; no server is required. In-place phone installation and preservation of the user's installed data still await the user's report. No additional full-day wait is required before this update.

### Personal APK accepted for use (2026-10-10)

After receiving the personal APK, the user reported that everything seems fine and that they can use it personally. The personal-use checkpoint is accepted based on that overall phone report. Individual history/preferences/icon/panel checks were not separately detailed, and no update issue was reported. There is no outstanding required waiting period.

Next work is optional for the personal app: backup/export and restore, requested usability improvements, or fixes if an issue appears. A public version is a separate future path: separate build identity, backup/data behavior, ads and consent/privacy preparation, current Google Play requirements and store materials, release testing, and explicit publication approval. Do not begin ads or public publishing merely because the personal app is accepted.

### Personal widget discussion and account setup (2026-10-10)

The user chose to skip backup and cloud sync for now and requested finishing personal improvements before public-app work. The current discussion is a small home-screen widget, using their Smoke Free widget screenshot as a reference for compact size and two-line text density. Proposed states show the pill time, an outstanding-pill prompt with the next reminder time, or a recorded-day streak. Tapping opens the app for explicit review/confirmation; it does not silently record a dose. These are design proposals, not an implemented or approved widget.

The user reported that they are currently setting up Google Play Console and the Google advertising account discussed above (AdMob). Neither account is yet confirmed ready, and no publisher IDs or credentials have been supplied. Account setup runs alongside personal-widget discussion; public build and ads integration remain deferred. The repository stays private.

### Personal widget implementation (2026-10-10)

The user approved the two-line widget design. AdMob registration is complete according to their report; its dashboard showed account verification in progress. Google Play Console asked for its registration fee, and the user deferred further account setup until the public version needs it. Work returned to the personal widget; no ads or public build are being added.

The native module now provides a compact resizable Android widget reading the existing database, with saved pill time, outstanding-routine text and recorded-day streak. Taps use the existing explicit date-review flow. Writes and reminder reconciliation refresh widgets; a separate inexact non-wakeup boundary alarm and Android periodic updates handle time-dependent states without consuming reminder slots. Errors in widget rendering do not fail successful recording or reminder reconciliation. See PERSONAL_WIDGET.md for state rules, update limitations and installation checks. The personal version code is increased to 3 for a compatible update. Verification and APK results follow separately.

### Personal widget APK result (2026-10-10)

The [personal widget APK](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/a97adaf9-9057-4770-b966-8d54e22014c9) completed successfully from `68ebef7`, with existing package/signing identity and version code 3. Android compilation/resources and packaging passed. All 19 native tests passed, zero failures: ten existing reminder/storage tests, seven widget-state tests, and two widget/database integration tests. The 27 JavaScript tests, lint, TypeScript, formatting, build-identity upgrade regression and GitHub checks passed. The update is ready for installation without uninstalling or clearing data; actual launcher appearance, tap behavior and refresh still await the user's report. No Google account setup, public build, ad SDK, backup or cloud service was added.

### Widget phone results and navigation/style refinement (2026-10-10)

The user reported that the widget's taken state works, Undo restores “Take your pill” and reminder text, and tapping opens the app's routine-review flow. They requested a smaller translucent panel matching their Smoke Free reference. They also reported the review card remains after confirming with the main button and reappears on widget taps even when today is taken. They preferred removing the card and having both notifications and widgets open Home.

The routine-review card and its state/action were removed; ordinary confirmation dialogs and calendar corrections remain. New native links open Home, and the app treats older dated links as Home navigation for compatibility with existing notifications/widgets. The widget now has a fixed 44dp visible panel with 40% opacity dark teal background and smaller two-line text rather than stretching across the full row height. The personal version code is 4 for an in-place update. All 27 JavaScript tests, lint, TypeScript and formatting passed, including Home/legacy-link routing and upgrade checks. Native tests/build and the refined appearance on the phone remain pending until recorded below.
