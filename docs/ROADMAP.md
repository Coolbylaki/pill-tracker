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
