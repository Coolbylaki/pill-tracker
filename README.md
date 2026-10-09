# Pill Tracker

An offline Android app for one daily pill-taking confirmation, a calendar of past confirmations, and up to two reminders per day.

## Project status

Preparation and the minimal Expo SDK 57 / TypeScript scaffold are complete. Code checks pass locally and on GitHub. On 2026-10-09, the user confirmed that the starter screen runs on their Android phone through Expo Go. The first dark home screen and local daily confirmation flow are implemented. The user verified confirmation persistence, undo persistence, cancellation, and reopening through Expo Go on their phone. The monthly history calendar is implemented and verified by the user on their phone, including year-boundary navigation and the six-row March 2026 layout. Past-date corrections, preservation of existing records, future-date protection, and synchronization with today were verified by the user on their phone. Native reminder test APKs built successfully, and the user verified short delivery while visible, locked, and swiped away, plus simulated cancellation. First-launch setup, saved dark/light appearance and daily pill time, Settings, permission controls, and reminder planning are implemented. Setup and Settings were verified on the phone. Daily reminders are now implemented through a local Android module; native-build and real-schedule phone verification are the current checkpoint.

## Agreed direction

- React Native, Expo, and TypeScript.
- Local SQLite storage; no login or cloud dependency in version 1.
- Android physical-device development build for reminder verification.
- Dark preselected at first launch; dark/light appearance editable in Settings.
- One codebase with an ad-free personal build and a future free public build with ads.
- Private GitHub repository: https://github.com/Coolbylaki/pill-tracker.

## Documents

- [Product specification](docs/SPECIFICATION.md)
- [Milestones](docs/ROADMAP.md)
- [Development workflow](docs/DEVELOPMENT.md)
- [Reminder testing](docs/REMINDER_TESTING.md)
- [Daily reminder phone checks](docs/DAILY_REMINDER_TESTING.md)

## Working agreement

Build one milestone at a time. Explain the change, implement it, verify it, commit it, and push each completed checkpoint. Keep the history understandable. Do not deliver the entire app in a single step.

## Local development

Recommended runtime: Node.js 24 LTS (see `.nvmrc`). The existing Node.js 26 installation also meets the current React Native requirement.

```powershell
cd 'C:\Projects\Pill Tracker'
npm ci
npm start
```

For an initial UI check, install Expo Go on your Android phone and scan the terminal QR code while both devices use the same network. If the installed Expo Go version does not support this SDK, use a matching development build. Notification reliability will be tested separately in a development build.

## Code checks

```powershell
npm run check
npm run format
npm run lint:fix
```

`check` runs ESLint, TypeScript, Prettier's formatting check, and database/date tests. Formatting is handled by Prettier; ESLint handles code correctness using Expo's configuration. `eslint-config-prettier` disables conflicting style rules. GitHub Actions runs the same checks with `npm ci` on Node.js 24.

The home screen shows today's date, a confirmation button, a saved time, and a deliberate undo action. Confirmations are stored in SQLite with one record per local calendar day. A monthly calendar below the button shows recorded days, highlights today, and supports month navigation. Dates up to today can be corrected with confirmation. Historical additions do not invent a taking time. First-launch setup saves appearance and pill time; Settings includes optional reminder delay overrides and permission controls. The short notification test is available in test/development builds. Daily reminders use native Android scheduling, saved settings, and confirmation checks; real-schedule phone verification is pending. Ads remain a later milestone.
