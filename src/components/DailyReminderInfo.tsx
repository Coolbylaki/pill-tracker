import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DailyReminderStatus } from '../reminders/dailyReminders';
import { useTheme, type Palette } from '../theme';
import { dateFromKey, localDateKey } from '../utils/dates';

export function DailyReminderInfo({
  status,
  onRetry,
  title = 'Daily reminders',
}: {
  status: DailyReminderStatus | null;
  title?: string;
  onRetry?: () => void;
}) {
  const styles = makeStyles(useTheme());
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>
      {!status ? (
        <Text style={styles.copy}>Checking your schedule…</Text>
      ) : status.error ? (
        <>
          <Text style={styles.copy}>{status.error}</Text>
          {onRetry && status.supported && (
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
              <Text style={styles.link}>Try updating reminders</Text>
            </Pressable>
          )}
        </>
      ) : !status.enabled ? (
        <Text style={styles.copy}>Switched off in Settings.</Text>
      ) : !status.notificationsAllowed ? (
        <Text style={styles.copy}>
          Notifications are off in Android settings. Your pill recording still works.
        </Text>
      ) : (
        <>
          {status.scheduled.map((reminder) => {
            const date = new Date(reminder.at);
            const routine = dateFromKey(reminder.routineDate);
            const routineLabel = routine.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
            return (
              <Text key={reminder.sequence} style={styles.copy}>
                {reminder.sequence === 1 ? 'First' : 'Critical'}:{' '}
                {date.toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {localDateKey(date) !== reminder.routineDate ? ` · for ${routineLabel}` : ''}
              </Text>
            );
          })}
          {!status.scheduled.length && (
            <Text style={styles.copy}>
              No pill reminders are pending. The schedule checks again tomorrow.
            </Text>
          )}
          {!status.exactAllowed && (
            <Text style={styles.copy}>
              Allow Alarms & reminders in Settings for accurate times. Android may delay reminders
              without this access.
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 24,
      padding: 20,
      gap: 12,
    },
    heading: { color: colors.text, fontSize: 17, fontWeight: '600' },
    copy: { color: colors.muted, fontSize: 13, lineHeight: 22 },
    retry: { minHeight: 48, justifyContent: 'center' },
    link: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  });
