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

- Monthly calendar display and navigation are implemented. Phone verification and deliberate past-date editing remain pending.

## Later options

Backup/export, optional cloud sync, home-screen widget, configurable reminder offsets, and paid public ad removal. These are proposals, not committed version-1 scope.
