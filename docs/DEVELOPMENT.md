# Development workflow

## Environment inventory (2026-10-09)

- Windows; project directory: C:\Projects\Pill Tracker.
- Git 2.54.0 is installed and has an existing author identity.
- Node.js 26.1.0 and npm 11.13.0 are installed.
- GitHub CLI 2.102.0 is now installed. Browser authentication has been started; private repository creation and the first push are pending user sign-in.
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
