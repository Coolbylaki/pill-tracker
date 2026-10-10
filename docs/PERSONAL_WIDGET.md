# Personal home-screen widget

The user approved the compact two-line design on October 10, 2026, based on their Smoke Free widget. Google Play Console registration/payment and further AdMob setup are deferred until public-release preparation is needed. AdMob registration is reported complete, with account verification pending. Backup and cloud sync remain out of scope.

## Appearance and behavior

The widget defaults to two columns by one row, with a dark teal rounded background, centered white text and mint completed-state text. It can be resized; actual dimensions and padding depend on the launcher. It uses native Android text rather than a generated image.

| State                                        | First line     | Second line        |
| -------------------------------------------- | -------------- | ------------------ |
| Before pill time                             | Pill at 08:00  | Today              |
| Due, first reminder still future             | Take your pill | Reminder at 09:00  |
| First reminder passed, critical still future | Take your pill | Reminder at 14:00  |
| Both reminders passed or consumed            | Take your pill | Not recorded today |
| Reminders disabled, pill due                 | Take your pill | Reminders off      |
| Recorded today                               | 5-day streak   | Taken today        |

Times and streak values above are examples. Saved settings control the displayed time. A reminder due the next calendar day uses “Tomorrow at …”. An outstanding routine crossing midnight shows “Yesterday's routine” and targets that date until today's pill time takes priority. Today's completed state takes priority when today is recorded.

A streak counts consecutive local dates marked taken, ending today. Past-date corrections count, gaps stop the streak, and Undo updates the state. It reflects recorded history rather than independently verified pill-taking.

Tapping anywhere opens the app's existing date-review flow. It never writes a record. First-launch or storage-error states instead ask the user to open the app. The widget reads the same framework SQLite database as recording and daily reminders; it never resets delivery limits or schedules additional notifications.

## Refresh and installation

Successful record/settings writes and daily-reminder reconciliation refresh installed widgets. Android also refreshes them periodically, on resize/add, and through a separate non-wakeup inexact alarm at the next pill time, reminder boundary or local midnight. The existing reboot, app-update and time-zone/clock-change receiver reconciles reminders and refreshes the widget even with reminders disabled. Removing the last widget cancels its separate update alarm.

Android can delay time-based widget refreshes, particularly while idle; the widget is not a live countdown. Confirmation/Undo changes refresh as part of the saved write. It does not require JavaScript or a development server to run in the background. [Android update guidance](https://developer.android.com/develop/ui/views/appwidgets/advanced).

This native change requires a new APK. The personal profile keeps its existing package/signing identity and raises version code to 3. Install over the existing personal app without uninstalling or clearing data, then open once. Long-press an empty area of the Android home screen, choose Widgets, find Pill Tracker and drag its widget onto the screen. Launcher menu wording may differ.

Phone review: check that two lines fit, tap opens the app without recording, confirm updates to a streak, Undo restores the outstanding state, and a deliberate calendar correction recalculates the streak. Use existing history/settings; do not erase data or delay taking a pill to test the widget. Native cloud tests and APK results will be recorded once completed; launcher behavior remains subject to the user's phone check.

## Build result

The [personal widget APK](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/a97adaf9-9057-4770-b966-8d54e22014c9) completed successfully on October 10, 2026, from `68ebef7`. It uses version code 3 and the existing personal signing key/package. All 19 native tests passed (10 existing tests plus seven widget-state and two widget/database tests), with zero failures. The 27 JavaScript tests, lint, TypeScript, formatting and GitHub checks passed. Physical launcher layout, tapping and widget refresh remain for the user's phone review.
