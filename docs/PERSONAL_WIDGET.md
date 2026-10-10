# Personal home-screen widget

The user approved the compact two-line design on October 10, 2026, based on their Smoke Free widget. Google Play Console registration/payment and further AdMob setup are deferred until public-release preparation is needed. AdMob registration is reported complete, with account verification pending. Backup and cloud sync remain out of scope.

## Appearance and behavior

The widget defaults to two columns by one row, with a translucent dark teal rounded background (40% opacity), centered white text and mint completed-state text. Its visible panel is 51dp high, centered inside the launcher cell, with 14sp/12sp text; it does not stretch vertically to fill a tall row. It can be resized; actual cell dimensions and outer padding depend on the launcher. It uses native Android text rather than a generated image.

| State                                        | First line     | Second line        |
| -------------------------------------------- | -------------- | ------------------ |
| Before pill time                             | Pill at 08:00  | Today              |
| Due, first reminder still future             | Take your pill | Reminder at 09:00  |
| First reminder passed, critical still future | Take your pill | Reminder at 14:00  |
| Both reminders passed or consumed            | Take your pill | Not recorded today |
| Reminders disabled, pill due                 | Take your pill | Reminders off      |
| Recorded today                               | 5-day streak   | Taken today        |

Times and streak values above are examples. Saved settings control the displayed time. A reminder due the next calendar day uses “Tomorrow at …”. An outstanding routine crossing midnight shows “Yesterday's routine” until today's pill time takes priority. Today's completed state takes priority when today is recorded.

A streak counts consecutive local dates marked taken, ending today. Past-date corrections count, gaps stop the streak, and Undo updates the state. It reflects recorded history rather than independently verified pill-taking.

Tapping anywhere opens Home, whether or not today is already recorded. Daily notifications also open Home. The extra “Review this routine” card was removed at the user's request; older dated links from previously delivered notifications are accepted as Home links. Tapping never writes a record. Today's usual confirmation button and deliberate calendar corrections remain available. The widget reads the same framework SQLite database as recording and daily reminders; it never resets delivery limits or schedules additional notifications.

## Refresh and installation

Successful record/settings writes and daily-reminder reconciliation refresh installed widgets. Android also refreshes them periodically, on resize/add, and through a separate non-wakeup inexact alarm at the next pill time, reminder boundary or local midnight. The existing reboot, app-update and time-zone/clock-change receiver reconciles reminders and refreshes the widget even with reminders disabled. Removing the last widget cancels its separate update alarm.

Android can delay time-based widget refreshes, particularly while idle; the widget is not a live countdown. Confirmation/Undo changes refresh as part of the saved write. It does not require JavaScript or a development server to run in the background. [Android update guidance](https://developer.android.com/develop/ui/views/appwidgets/advanced).

This native change requires a new APK. The personal profile keeps its existing package/signing identity and raises version code to 5 for the measured padding adjustment. Install over the existing personal app without uninstalling or clearing data, then open once. Long-press an empty area of the Android home screen, choose Widgets, find Pill Tracker and drag its widget onto the screen. Launcher menu wording may differ.

Phone review for the refinement: check that the compact translucent panel fits, tapping opens Home without a review card both before and after confirmation, and normal confirmation/Undo still refreshes the widget. Use existing history/settings; do not erase data or delay taking a pill to test the widget. The user has already reported the first widget's taken state, Undo/reminder text and app opening passed; they requested the simpler Home destination and smaller translucent style. Calendar correction/streak and time-dependent launcher updates were not separately reported.

## First widget build result

The [personal widget APK](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/a97adaf9-9057-4770-b966-8d54e22014c9) completed successfully on October 10, 2026, from `68ebef7`. It uses version code 3 and the existing personal signing key/package. All 19 native tests passed (10 existing tests plus seven widget-state and two widget/database tests), with zero failures. The 27 JavaScript tests, lint, TypeScript, formatting and GitHub checks passed. Physical launcher layout, tapping and widget refresh remain for the user's phone review.

## Latest refinement build result

The [compact translucent widget APK](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/c4a5b3e4-27b5-47ed-9746-ea2e727af65f) completed successfully on October 10, 2026, from `a296afa`, version code 4, with the existing signing identity. All 19 native tests passed with zero failures, alongside 27 JavaScript tests and GitHub checks. The first widget's taken state, Undo/reminder text and opening the app passed the user's phone checks. The latest size/transparency and Home-only tap behavior await their review.
