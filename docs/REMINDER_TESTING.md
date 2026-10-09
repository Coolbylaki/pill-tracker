# Reminder feasibility testing

This checkpoint tests Android's local notification delivery. It does not enable the production one-hour/six-hour routine.

## Apps and records

- **Pill Tracker Dev**: a development APK for live changes, using `npm run start:dev`.
- **Pill Tracker Test**: a standalone APK containing the same test panel; it works without Expo Go, the computer, or the development server.
- Expo Go, Dev, and Test have separate local databases. Installing a test app does not transfer or remove Expo Go history.
- The development identifiers are `com.coolbylaki.pilltracker.dev` and `com.coolbylaki.pilltracker.test`. Public/personal release identifiers will be decided later.
- Expo project: https://expo.dev/accounts/coolbylaki/projects/pill-tracker

## Completed test builds

Built on 2026-10-09 from commit `63aad66`:

- [Install Pill Tracker Test](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/7c8fee0e-d9f7-4257-b6ca-94118f2249cf) for the server-independent phone checks below.
- [Install Pill Tracker Dev](https://expo.dev/accounts/coolbylaki/projects/pill-tracker/builds/6d2186fe-e615-4126-9a62-167e274dff81) for live development.

## Install and enable

1. Open the completed EAS build link on the Android phone, download its APK, and install it. Android may ask you to allow installation from that browser.
2. Start the app. The standalone Test app should open without the server. For Dev, start `npm run start:dev` and open its project link.
3. Scroll down and open **Reminder test**.
4. Allow notifications when scheduling the first pair.
5. For accurate scheduling, find **Alarms & reminders** under Android's special app access and allow the installed test app. Enable it before scheduling; rearm tests after changing this setting.

## Delivery

Tap **Test in 30s and 90s**. Two test notifications are registered with Android. The panel shows their planned times.

- Start with the app visible, then repeat with the phone locked and the app swiped away from Recents.
- With the standalone Test app, stop the development server or turn the computer off. Delivery should still work.
- Closely spaced alarms can be delayed by Android's idle restrictions, even with exact-alarm permission. Record actual delivery times rather than assuming a delayed second test means scheduling failed.
- Refresh the pending count to inspect remaining scheduled test notifications. The counter is refreshed on returning to the app too.
- Delivery tests intentionally run even if today's pill record is already confirmed. They are clearly labeled as test notifications.

## Cancellation

1. Schedule the short pair, then tap **Simulate today's confirmation** before the first notification. Today's tests should be canceled, with pill history unchanged.
2. Schedule tomorrow's pair too, then simulate today's confirmation. Tomorrow's pair should remain pending.
3. Use **Cancel all test notifications** to clean up. Only this panel's test notifications are affected.
4. If today's actual pill record is unconfirmed, confirming it through the normal button also cancels today's test notifications. Do not alter real history merely to run this check.

Rearming a date replaces its previous test pair. A failure partway through scheduling removes the newly created partial pair. Scheduling and cancellation operations are serialized.

## Across days and reboot

Use **Schedule tomorrow's test**, which registers two dated notifications at tomorrow's equivalent local time plus 30 and 90 seconds. Leave the app unopened until their delivery times. You can also reboot before those times to check native restoration of pending notifications. This is an overnight check, not something proven by the automated tests.

Do not use Android's **Force stop**, uninstall, or data clearing as a normal app-close test; those operations are separate lifecycle cases.

## What remains

Automated tests cover planning, date-scoped cancellation, rearming without duplicate accumulation, and cleanup after scheduling failure. The user reported successful 30s/90s delivery with the phone on, locked, and after swiping the app away from Recents; simulated cancellation, date-scoped pending counts, and cancel-all also passed. These short tests do not establish long-term idle behavior, overnight delivery, reboot restoration, or cancellation through the actual daily confirmation button; those checks remain pending.

The installed Expo Android scheduling code stores requests natively and restores them at boot. It falls back to inexact alarms if exact-alarm access is absent. Ordinary repeating Expo notifications do not independently query our SQLite confirmation history before background delivery. The production design still needs to handle indefinite daily scheduling and skipping completed routine days without requiring a daily app launch; these two-day tests do not prove that behavior.

References: [Expo notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [Android alarms](https://developer.android.com/develop/background-work/services/alarms), [Android idle behavior](https://developer.android.com/training/monitoring-device-state/doze-standby).
