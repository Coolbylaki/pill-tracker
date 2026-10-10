# Personal Android release

On 2026-10-10, the user accepted the completed overnight cycle and checks on both phones as sufficient to proceed. No additional 24-hour waiting period is required. The focused reminder checks at handover passed reported phone testing, including cancellation after the first notification and direct exact-alarm settings navigation.

## Build and update

Run `npm run build:personal` to create a standalone internal APK named **Pill Tracker**, without the delivery-test panel or ads. The profile now runs all 19 native Android tests before packaging, including nine widget checks. JavaScript checks remain `npm run check`.

The personal profile deliberately keeps `com.coolbylaki.pilltracker.test` and `pill-tracker-test` from the installed Test app. These internal identifiers are retained for an in-place update and compatible notification links; Test is removed from the visible launcher name. The existing EAS signing credentials for that package must be reused. The previous repaired Test APK has version code 1; the first personal APK uses version code 2.

Install over **Pill Tracker Test** without uninstalling or clearing data, then open once. Existing history, saved preferences, and the daily delivery ledger use the same database and schema. Startup clears only leftover delivery-test notifications; normal daily scheduling reconciles from saved settings and history. No record or reminder-limit reset is performed. Confirm that your existing history and preferences are still present and the test panel is absent after installation; this is an update check, not another day-long reminder trial.

The personal APK does not replace **Pill Tracker Dev** or Expo Go; those have separate databases. If Android rejects the update, keep the installed app and its data and investigate package, signing, and version compatibility. Do not uninstall as a workaround. Future personal updates must increase the version code. The Google Play/public identity is a later decision.

## Branding

The user chose to retain **Pill Tracker** and approved a mint/ivory capsule icon with a dark teal confirmation tick. The opaque launcher asset is `assets/pill-icon.png`; the transparent adaptive foreground is `assets/pill-icon-foreground.png`. Android uses a dark teal background and the foreground alpha for themed icons. Original scaffold assets remain available but are no longer used for the Android launcher.

The built-in ImageGen tool generated the assets. Exact prompts are saved in [Branding prompts](BRANDING_PROMPTS.md).

## Scope

The personal app remains offline and ad-free. No account, cloud database, ads, store submission, or public publishing is part of this checkpoint. Continued ordinary use can reveal issues, but it is not a new release gate imposed after the accepted phone checks.

The first personal APK completed successfully on 2026-10-10 from source commit `37860ce`, with all 10 native Android tests passing (0 failures). Lint, TypeScript, formatting, all 27 JavaScript tests, Android Hermes export, and GitHub Actions passed. EAS reused the existing package's default remote keystore; metadata confirms the Test package and version code 2. After receiving the personal APK, the user reported on 2026-10-10 that everything seems fine and accepted it for personal use. No issue with the update was reported; individual installation-check details were not separately supplied.

## Install the first personal APK

[Install Pill Tracker personal APK](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/c249e98b-0b28-432f-89f3-96fe4e185319).

Install as an update over Pill Tracker Test, then open once and verify existing history/preferences, the new icon/name, and the absence of the test panel. No development server is required. Do not uninstall or clear data.

## First personal widget update

[Install Pill Tracker with the personal widget](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/a97adaf9-9057-4770-b966-8d54e22014c9).

This build completed on October 10, 2026, from `68ebef7`, with version code 3 and the existing signing key/package. All 19 Android tests passed with zero failures, as did 27 JavaScript tests and GitHub checks. Install over the current personal app and open once. Long-press an empty home-screen area, choose Widgets, find Pill Tracker and drag its widget onto the screen. Phone layout/tap/refresh review is still pending. See [Personal widget](PERSONAL_WIDGET.md) for behavior and review details.

## Compact translucent widget and Home navigation

[Install the refined personal APK](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/c4a5b3e4-27b5-47ed-9746-ea2e727af65f).

Completed on October 10, 2026, from `a296afa`, version code 4, with the existing personal package/signing key. All 19 native tests, 27 JavaScript tests and GitHub checks passed. Install over the current app without uninstalling or clearing data and open once to refresh the widget. The visible widget panel is shorter and translucent; notification/widget taps open Home and the routine-review card is removed. The user already reported the first widget's taken/Undo/reminder-text/app-opening checks passed; the refined style and simpler navigation await phone review.

## Measured reference size and padding

[Install the widget size/padding update](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/41edadec-6df5-4e66-bf7d-1a5b65fd7302).

Completed on October 10, 2026, from `9745518`, version code 5, using the existing personal package/signing key. All 19 native tests, 27 JavaScript tests and GitHub checks passed. The user reported version 4's behavior tests are good. This update matches the reference's measured height ratio (120px reference versus 103px previous widget at the same width), using a 51dp visible panel and 14sp title. Install over the existing app and open once to refresh the widget. Only a side-by-side appearance check remains for this adjustment.

## Latest update: Galaxy A16 height calibration

[Install the final widget-height adjustment](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/a7547145-e184-4037-8fd1-68b3c8bd79fe).

Completed on October 10, 2026, from `a961033`, version code 6, with the existing package/signing key. All 19 native tests, 27 JavaScript tests and GitHub checks passed. The user's full Galaxy A16 screenshot showed the panel roughly 2px shorter than the reference. Visible/minimum height is now 52dp, one dp taller, with the same text sizing and spacing. Install over the current app and open once to refresh the widget; the final visual alignment awaits the user's report.

## Latest source update: wording and Settings About

Source commit `a4f0ff4` completes the requested wording review and small About footer. All 27 JavaScript tests, lint, TypeScript and formatting passed. The widget's version-6 appearance is accepted as-is. Version code 7 is prepared for an in-place APK update, but no APK is available yet: automatic approval review blocked the Expo/EAS cloud build until the user explicitly authorizes uploading this private source to that service. Native build checks remain pending. The installed version-6 app remains usable.
