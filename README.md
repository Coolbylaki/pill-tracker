# Pill Tracker

An offline Android app for one daily pill-taking confirmation, a calendar of past confirmations, and up to two reminders per day.

## Project status

Preparation and the minimal Expo SDK 57 / TypeScript scaffold are complete. Code checks pass locally and on GitHub. On 2026-10-09, the user confirmed that the starter screen runs on their Android phone through Expo Go. The first dark home screen and local daily confirmation flow are implemented. Verification of this new flow on the phone, the calendar, and development-build reminders remain pending.

## Agreed direction

- React Native, Expo, and TypeScript.
- Local SQLite storage; no login or cloud dependency in version 1.
- Android physical-device development build for reminder verification.
- Dark mode by default, with light and device-theme settings.
- One codebase with an ad-free personal build and a future free public build with ads.
- Private GitHub repository: https://github.com/Coolbylaki/pill-tracker.

## Documents

- [Product specification](docs/SPECIFICATION.md)
- [Milestones](docs/ROADMAP.md)
- [Development workflow](docs/DEVELOPMENT.md)

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

The home screen shows today's date, a confirmation button, a saved time, and a deliberate undo action. Confirmations are stored in SQLite with one record per local calendar day. The calendar, reminders, light theme, and ads are not implemented yet.
