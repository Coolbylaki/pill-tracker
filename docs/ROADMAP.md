# Milestones

Each milestone ends with a reviewable result, appropriate verification, a descriptive commit, and a push when GitHub authentication is available.

1. **Preparation**: agreed specification, workflow, Git repository, private GitHub remote, and tool inventory.
2. **First Android screen**: verify current Expo requirements, scaffold TypeScript app, establish build configuration, and run a minimal screen on the physical phone. No complete app in this step.
3. **Reminder feasibility**: use accelerated test reminders in a development build to verify background delivery, cancellation, and scheduling across days. Determine native integration needs before promising reliability.
4. **Daily recording**: primary button, confirmation, completed state, undo, SQLite persistence, and duplicate prevention.
5. **Calendar**: monthly navigation, date statuses, and deliberate history corrections.
6. **Settings and production reminders**: routine time, theme, permissions, two-reminder rule, and schedule reconciliation.
7. **Personal trial**: actual phone use; check restart, midnight, clock changes, time zones, updates, and disabled permissions. Resolve failures before release.
8. **Backup and public preparation**: choose backup behavior; add separate personal/public build configuration, ads with required consent, privacy policy, data declarations, and store materials.
9. **Google Play release**: verify account eligibility and current health/advertising/testing requirements, perform required testing, review the concrete release, then publish when explicitly requested.

## Completed checkpoints

- Preparation and private GitHub setup are complete.
- Minimal Expo/TypeScript scaffold, ESLint, Prettier, and GitHub checks are complete.
- Starter screen verified by the user on their Android phone through Expo Go on 2026-10-09. Development-build and reminder verification remain pending.

- First dark home screen and SQLite daily confirmation/undo are implemented. The user verified the basic recording flow on their phone on 2026-10-09.

- Monthly calendar display and navigation are implemented and phone-verified on 2026-10-09. Deliberate date corrections were also phone-verified on 2026-10-09.

- Reminder test APKs built successfully; short delivery while visible, locked, and swiped away, plus simulated cancellation, passed reported phone checks. Overnight delivery, reboot restoration, and indefinite daily scheduling remain pending.
- First-launch setup, persisted dark/light and pill-time preferences, Settings, permission controls, and reminder planning are implemented. Setup was phone-verified. Native daily-schedule integration is implemented; both cloud APK builds and all 7 native planner tests passed. Real-schedule phone verification is next.

## Later options

Backup/export, optional cloud sync, home-screen widget, and paid public ad removal. These are proposals, not committed version-1 scope.

Shared-storage repair: theme, delay, and reminders-toggle persistence failures were reported. The installed Android app now shares one SQLite engine with the scheduler. Both updated builds passed 10 native tests and 26 JavaScript tests; the user verified all four saved-settings/Undo regressions on the phone. Actual daily delivery and lifecycle checks remain pending.

Latest phone results (2026-10-09): accelerated daily reminders both arrived while the phone was locked and the app swiped away. On another phone, tapping a real daily notification opened the correct routine date without confirming it; **Review this routine** opened the confirmation dialog, and Yes updated Home and the calendar. Overnight renewal, reboot delivery, and confirmation after the first reminder preventing the critical reminder remain pending. Permission navigation still needs phone review. Next is the planned October 9–10 overnight/reboot check; wait for the user's actual results before marking it complete.

Latest phone results (2026-10-10): the user reported both overnight delivery and reboot restoration passed. This completes the planned October 9–10 phone checkpoint; exact arrival timestamps were not supplied. Confirmation between the first and critical reminders preventing the critical notification, permission navigation, and the normal daily-use trial remain pending.

Follow-up report (2026-10-10): the user had also checked confirmation between reminders. After the first daily reminder, they opened its notification and recorded taking the pill; the critical reminder did not arrive. This phone cancellation check is passed. Permission navigation and the normal daily-use trial remain pending before personal-release preparation.

Exact-alarm navigation report (2026-10-10): the user confirmed the Alarms & reminders option opens this app's alarm toggle directly. The pending alarm-permission navigation check is passed. The focused reminder checks tracked at handover are now reported passed; normal daily use is next, before branding and a data-preserving personal-release transition.

Personal-release decision (2026-10-10): the user accepted the overnight cycle and checks on both phones as sufficient and requested proceeding without an additional 24-hour trial. Personal APK preparation is now the active checkpoint: approved pill icon, visible name Pill Tracker, no delivery-test panel or ads, and an in-place update preserving Test-app data. See PERSONAL_RELEASE.md. Cloud packaging and the installed-update result will be recorded separately.

First personal APK completed (2026-10-10): source `37860ce`, all 10 native tests passed, alongside 27 JavaScript tests and GitHub checks. Branding, visible name, test-panel removal, and compatible update configuration are complete. The APK is linked in PERSONAL_RELEASE.md; the remaining checkpoint is the in-place phone update preserving history/settings, without another day-long wait.

Personal use accepted (2026-10-10): after receiving the personal APK, the user reported everything seems fine and accepted it for personal use. The personal-release checkpoint is complete. Backup/export/restore and requested polish are optional next improvements. Public-build separation, ads/consent/privacy, Google Play preparation, required release testing, and explicit publication approval remain a separate future path.

Personal widget update (2026-10-10): backup/cloud sync were skipped, the compact two-line widget design was approved, and Google account setup/public preparation were deferred. The personal widget APK built successfully from `68ebef7`, version code 3, with all 19 native and 27 JavaScript tests passing. See PERSONAL_WIDGET.md and PERSONAL_RELEASE.md for the APK and phone-review steps. Launcher appearance/tap/refresh acceptance remains pending; the current personal app remains offline and ad-free.

Widget refinement (2026-10-10): the user reported taken-state, Undo/reminder text and app opening passed. They requested a smaller translucent widget and removal of the routine-review card so notification/widget taps open Home. The refined APK built from `a296afa`, version code 4, with all 19 native and 27 JavaScript tests plus GitHub checks passing. Latest appearance/Home-navigation phone review remains pending; Google account/public preparation is still deferred.

Measured-padding update (2026-10-10): the user reported the latest behavior tests are good. A side-by-side screenshot showed equal widths but a 120px reference height versus the widget's 103px; the panel height and title size were adjusted to match that scale. Version-5 APK from `9745518` built successfully with all 19 native and 27 JavaScript tests and GitHub checks passed. Only the measured appearance match awaits phone review for this adjustment.

Galaxy A16 calibration (2026-10-10): the full screenshot showed the remaining roughly 2px height difference. Panel height is now 52dp, preserving text size/spacing and behavior. Version-6 APK from `a961033` built successfully with all 19 native and 27 JavaScript tests plus GitHub checks passed. Final outline alignment awaits phone review; public/account work stays deferred.

Personal polish (2026-10-10): the user accepted the widget as-is after the Galaxy A16 comparison, including its current edge rendering. They requested a wording review and a small About section in Settings, with only a widget-availability note and no widget instructions. Copy now explains pill-time-based delays, preview versus saved settings, cancellation after recording, and permission status more plainly. Settings includes version/build, offline/on-device records and widget availability in a muted footer. No new feature or public/account setup is included. Personal version-code 7 packaging is pending.

Personal polish APK complete (2026-10-10): after explicit Expo/EAS upload approval, the version-code 7 APK from `ec026fd` completed successfully with all 19 native tests passing (zero failures). The wording/About implementation also passed all 27 JavaScript tests, lint, TypeScript, formatting and GitHub checks. The install link is in PERSONAL_RELEASE.md. The widget appearance is accepted and unchanged. The user can review the small Settings About footer and revised copy after updating; public/account preparation remains deferred.

Final personal release requested (2026-10-10): the user requested version 1.1.0 in the app and GitHub release, moving widget availability to the bottom of Home, and committing/pushing everything. Android version code advances to 8 for a compatible update, hidden from About. Build and GitHub release results will be recorded separately. The personal feature scope is complete; work on the ad-supported version is deferred until the user resumes it tomorrow. Repository privacy is retained.
