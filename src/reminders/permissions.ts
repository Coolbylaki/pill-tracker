import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

export const nativePermissionsAvailable = Platform.OS === 'android' && !isRunningInExpoGo();

export async function notificationAccess(request = false): Promise<string> {
  if (!nativePermissionsAvailable) return 'Use the installed Android app to manage permissions.';
  await Notifications.setNotificationChannelAsync('pill-tracker-reminders', {
    name: 'Daily pill reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
  let permission = await Notifications.getPermissionsAsync();
  if (request && !permission.granted && permission.canAskAgain)
    permission = await Notifications.requestPermissionsAsync();
  return permission.granted
    ? 'Notifications allowed'
    : 'Notifications off. You can still record your pills.';
}

export async function openAlarmAccess(): Promise<void> {
  try {
    await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
  } catch {
    await Linking.openSettings();
  }
}
