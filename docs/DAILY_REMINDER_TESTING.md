# Daily reminder phone checks

This checkpoint connects saved preferences to the native Android scheduler. These checks use the daily schedule, not the independent 30s/90s delivery-test panel.

## Latest builds with shared-storage repair

Built from `fcd3779` on 2026-10-09. All 10 Android tests passed in both builds, including native SQLite/scheduler integration regressions:

- [Install Pill Tracker Test](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/37a221a3-b7cf-4dfb-85d1-171c605ae795).
- [Install Pill Tracker Dev](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/d4234c7f-43ff-408e-8dbb-fabdfdaf1178).

These supersede the initial daily-scheduler builds. Dev must be updated before loading current JavaScript because storage now uses new native bridge methods.

## Before testing

Install the updated Pill Tracker Test APK over the existing app to retain its history and preferences. Open it once after installation. The Expo server is unnecessary.

In Settings, allow notifications and **Alarms & reminders**. The app now reports both permission states. On return from Android settings, the schedule updates automatically. Without exact-alarm access, Android uses less precise scheduling; delivery can be delayed.

## Saved-settings regression checks

The user reported all four saved-settings and Undo regression checks passed on 2026-10-09. This checklist remains available for later updates; actual daily delivery is the next phone check.

1. Choose Light and Save. Home changes immediately. Reopen Settings and restart the app: Light stays selected.
2. Set critical delay to 5 hours and Save. The saved schedule changes to pill time +5 hours. Reopen Settings and restart: the value remains 5.
3. Switch reminders off and Save. Home and the saved schedule show switched off. Restart: the switch remains off. Turn on and Save to restore the schedule.
4. Undo only an artificial record, with a future unsent reminder today. The schedule should include that future slot immediately. At 08:00 pill time, before 09:00 both defaults can return; between 09:00 and 14:00 only today's critical can return; after 14:00 both are tomorrow. Already delivered slots do not repeat. Record the phone time and pill time with the result.
5. Confirm real history remains intact. Restore the usual theme, delays, and reminder toggle after checking.

## Schedule and toggle

1. Check that theme, pill time, and history survived the update.
2. Inspect **Daily reminders** on Home or in Settings. It shows the next first and critical reminders with actual dates. If today is confirmed, both should refer to a future unconfirmed routine day. If only the first time has passed, today's critical reminder may remain while the next first reminder is tomorrow.
3. Turn reminders off and **Save settings**. Home should show switched off, with no pending daily schedule. Already displayed daily notifications are removed. The independent 30s/90s tests still ignore this toggle, as labeled in their panel.
4. Turn reminders on and Save. The plan should contain only future, unconfirmed, unsent reminders. Changes made and canceled must leave the active schedule untouched.
5. If all of today's reminder times have passed, reopening or saving must not produce immediate catch-up notifications. The next plan should use a future routine day.

## Accelerated real-schedule check

Reported passed on 2026-10-09: temporary 3-minute/6-minute scheduling, displayed upcoming times, and both notifications while locked with the app swiped away. Exact arrival timestamps were not supplied. Notification review/cancellation and longer lifecycle checks below remain pending.

For an unconfirmed routine day, temporarily set the pill time to the current hour/minute and the optional delays to **0.05 hours** (3 minutes) and **0.1 hours** (6 minutes). Save promptly and check the dated times on Home. If today is already confirmed, the reminders correctly move to tomorrow; use that day rather than undoing a genuine record solely to trigger notifications. Undo is suitable for an artificial test entry only.

- Wait for the first and critical reminders. Repeat an appropriate future check with the phone locked and the app swiped away from Recents.
- Tap a delivered notification. The app should identify its routine date. **Review this routine** opens the existing confirmation flow; opening the notification itself does not record pills.
- When a genuine confirmation is appropriate before the critical time, confirm that day. Remaining reminders for that routine date disappear; tomorrow's schedule remains. Past-date corrections also reconcile reminders associated with that date.
- Undoing an artificial confirmation restores only future reminders that have not already been sent. Past times are skipped.

The two-reminder limit is persistent for each routine date. Changing settings or undoing a confirmation does not reset already-sent reminder slots. After both have been sent for a day, further daily-schedule delivery tests use another day. The separate 30s/90s panel remains repeatable and does not count against that limit.

Android can delay closely spaced alarms while idle. Record approximate arrival times rather than treating a delayed second reminder as proof of failure. Restore the normal pill time and **1-hour / 6-hour defaults** after temporary testing.

## Overnight and reboot

Keep a future schedule pending, then leave the app unopened through the next routine day. Reminders should continue without a daily app launch. Reboot before a future reminder and unlock the phone once; the native boot receiver reconstructs the schedule from SQLite. These outcomes require physical-phone reports and are not established by unit tests or a successful build.

Normal app closing means swiping it away. Android **Force stop**, uninstalling, and clearing data are different lifecycle cases; pending alarms can be stopped or records deleted. A later normal app launch reconstructs future alarms from saved settings and history.

## Implementation notes

- A local Expo Android module uses dated AlarmManager PendingIntents. It keeps the next first/critical slots plus a quiet daily renewal alarm; each delivery also reconciles future slots. No JavaScript background timer or remote server is required.
- Settings and confirmation state are read from the existing SQLite database at delivery time. A writer transaction protects the confirmation check and notification posting from an intervening confirmation commit.
- A separate native-owned delivery table prevents duplicate first/critical slots for a routine date. Pill records are untouched by this ledger. Database and preferences versions are validated.
- Boot, app replacement, time changes, time-zone changes, and exact-alarm access grants rebuild alarms. App foreground, local-day rollover, settings saves, confirm, undo, and date corrections also reconcile the schedule.
- Clock/settings changes invalidate stale pending intents. Due times that are already past are not newly scheduled. A genuinely delayed registered alarm can still arrive, but an alarm delayed by a full day is discarded.
- Daily and test notifications have separate identities, channels, and cancellation paths. Turning daily reminders off does not silently change the explicit delivery-test behavior.
- Notification taps carry the original routine date. No pill confirmation is performed by a background receiver or by opening a URL.
- Scheduling failures cancel incomplete daily alarms, expose an error, and arrange a quiet retry. A successfully saved pill record or settings change is never described as unsaved merely because scheduling failed.

References: [Expo local native modules](https://docs.expo.dev/modules/get-started/), [Android alarms](https://developer.android.com/develop/background-work/services/alarms/schedule), [Android Java date API support](https://developer.android.com/studio/write/java8-support).
