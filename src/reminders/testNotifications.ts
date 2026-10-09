import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { armTests, cancelTests, TEST_KIND, type TestScheduler } from './testPlan';

export const canTestNotifications = Platform.OS === 'android' && !isRunningInExpoGo();
const channelId = 'pill-tracker-reminder-tests';
let operation: Promise<unknown> = Promise.resolve();

function exclusive<T>(action: () => Promise<T>): Promise<T> {
  const next = operation.then(action, action);
  operation = next.catch(() => undefined);
  return next;
}

if (canTestNotifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const scheduler: TestScheduler = {
  async list() {
    return (await Notifications.getAllScheduledNotificationsAsync()).map((item) => ({
      identifier: item.identifier,
      kind: item.content.data?.kind,
      routineDate: item.content.data?.routineDate,
    }));
  },
  schedule(reminder) {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: `Pill Tracker test ${reminder.sequence}/2`,
        body: `Reminder delivery test for ${reminder.routineDate}. This is a test notification.`,
        sound: 'default',
        data: { kind: TEST_KIND, routineDate: reminder.routineDate, sequence: reminder.sequence },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
        channelId,
      },
    });
  },
  cancel: Notifications.cancelScheduledNotificationAsync,
};

export async function pendingTestCount(): Promise<number> {
  if (!canTestNotifications) return 0;
  return (await scheduler.list()).filter((item) => item.kind === TEST_KIND).length;
}

export function scheduleTestPair(tomorrow = false) {
  return exclusive(async () => {
    if (!canTestNotifications) throw new Error('Open the Android test app instead of Expo Go.');
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Reminder delivery tests',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted)
      throw new Error('Notifications are disabled. Allow them in Android app settings.');
    return armTests(scheduler, new Date(), tomorrow);
  });
}

export function cancelTestReminders(routineDate?: string): Promise<number> {
  return exclusive(async () => {
    if (!canTestNotifications) return 0;
    const canceled = await cancelTests(scheduler, routineDate);
    for (const notification of await Notifications.getPresentedNotificationsAsync()) {
      const data = notification.request.content.data;
      if (
        data?.kind === TEST_KIND &&
        (routineDate === undefined || data.routineDate === routineDate)
      ) {
        await Notifications.dismissNotificationAsync(notification.request.identifier);
      }
    }
    return canceled;
  });
}
