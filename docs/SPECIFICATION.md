# Product specification

Agreed on 2026-10-09.

## Purpose

Help a person remember whether they have taken their daily pills. Version 1 represents all pills as one daily routine, with one confirmation per local calendar day.

## Home screen

- A large "I've taken my pills" button.
- A confirmation dialog before saving.
- After saving, show "Taken today at HH:mm" and prevent duplicate entries.
- Allow undo after accidental confirmation.
- Place a monthly calendar below the primary action.
- Show ticks on confirmed dates, highlight today, and leave future dates neutral.
- Navigate to previous and next months.
- Allow deliberate correction of today or past dates with confirmation. Future dates cannot be marked taken.
- Distinguish a past unrecorded date from a confirmed missed dose: absence of a record only means "not recorded."

## Reminders

- The user chooses a daily routine time; 08:00 is the initial default and is editable.
- There is no notification at the routine time.
- Reminder 1 occurs one hour after the routine time if the associated day is unconfirmed.
- Reminder 2 occurs six hours after the routine time if the associated day remains unconfirmed.
- Example: 08:00 routine, 09:00 reminder, 14:00 final reminder.
- At most two reminders for each routine day. No repeated nagging after the final reminder.
- Confirmation cancels pending reminders for that day.
- Reconcile schedules after undo, settings changes, restart, and time-zone or clock changes.
- Passed reminders are not replayed as a burst when settings change or the app opens.
- Keep reminders operating across consecutive days without requiring the app to be opened daily.
- If an offset crosses midnight, associate the reminder with its original routine date; recording must clearly identify that date.
- Default notification text should reveal no medication names.
- Add a notification action for recording with confirmation if practical; opening the confirmation screen is an acceptable first implementation.
- Provide a reminders toggle and explain notification permission status in settings.

Use local device notifications, not server push. Exact timing and background behavior must be verified on a physical Android device. Investigate whether Expo APIs alone can support multi-day scheduling and conditional delivery; add native Android integration if required. Do not rely solely on JavaScript background timers or blindly repeating reminders that ignore completion state.

## Settings and data

- Daily routine time, reminders enabled/disabled, and theme: dark, light, or device.
- Local SQLite database with unique routine dates, confirmation timestamps, and persisted settings.
- Use local calendar dates for the routine and timestamps with enough information to preserve history across time-zone changes.
- Preserve data through app updates and database migrations.
- No accounts or cloud sync in version 1.
- Backup/export is a later milestone; document uninstall and device-replacement behavior before public release.
- Use artificial data for screenshots and testing. Never commit personal medication history.

## Versions

- Personal: ad-free, directly installable Android build.
- Public: free with ads, added after the personal app is proven reliable.
- Ads must not interrupt recording or obscure the main action.
- Never provide pill history to advertising services.
- Public paid ad removal, accounts, and cloud sync are deferred.

## Out of scope for version 1

Multiple medications, dosage guidance, multiple daily routines, subscriptions, caregiver sharing, iOS, and social features.

## Acceptance examples

1. Confirm at 08:12: exactly one record and calendar tick; no 09:00 or 14:00 reminder.
2. Leave unconfirmed: reminders at 09:00 and 14:00, with no third reminder.
3. Confirm at 10:00 after reminder 1: reminder 2 is canceled.
4. Repeat a confirmation: no duplicate record.
5. Restart the app: history and settings persist.
6. Keep the app closed across multiple days: reminders continue for unconfirmed days.
7. Correct a past date: only that date changes; today's status remains correct.
8. Deny notification permission: recording still works and settings explain how to enable reminders.
9. Change time zone, reboot, or use an evening routine crossing midnight: history and reminders refer to the intended routine date.
