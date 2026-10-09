import { useTheme, type Palette } from '../theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  canTestNotifications,
  cancelTestReminders,
  pendingTestCount,
  scheduleTestPair,
} from '../reminders/testNotifications';
import { localDateKey } from '../utils/dates';

export function ReminderTestPanel({ disabled }: { disabled: boolean }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<number | null>(null);
  const [message, setMessage] = useState('Test delivery without changing your pill records.');
  const locked = useRef(false);

  const refresh = useCallback(
    () =>
      pendingTestCount()
        .then(setPending)
        .catch(() => setPending(null)),
    [],
  );
  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  async function run(action: 'now' | 'tomorrow' | 'confirm' | 'clear' | 'refresh') {
    if (locked.current || disabled) return;
    locked.current = true;
    setBusy(true);
    try {
      if (action === 'now' || action === 'tomorrow') {
        const plan = await scheduleTestPair(action === 'tomorrow');
        const times = plan
          .map((item) =>
            item.date.toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          )
          .join(' and ');
        setMessage(
          `Scheduled for ${times}. Lock the phone or swipe this app away to test delivery.`,
        );
      } else if (action === 'confirm' || action === 'clear') {
        const count = await cancelTestReminders(
          action === 'confirm' ? localDateKey(new Date()) : undefined,
        );
        setMessage(
          `Canceled ${count} pending test notification${count === 1 ? '' : 's'}. Your pill history is unchanged.`,
        );
      }
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'The notification test failed. Please try again.',
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  const actions = [
    ['now', 'Test in 30s and 90s'],
    ['tomorrow', 'Schedule tomorrow’s test'],
    ['confirm', 'Simulate today’s confirmation'],
    ['clear', 'Cancel all test notifications'],
    ['refresh', 'Refresh pending count'],
  ] as const;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.heading}
      >
        <Text style={styles.title}>Reminder test</Text>
        <Text style={styles.accent}>{expanded ? 'Hide' : 'Open'}</Text>
      </Pressable>
      {expanded &&
        (!canTestNotifications ? (
          <Text style={styles.copy}>
            Open the Android development app to test reminders. Expo Go’s pill records stay in Expo
            Go; the new app has its own records.
          </Text>
        ) : (
          <View style={styles.content}>
            <Text style={styles.copy}>
              Delivery tests run even if today is already confirmed. Simulating confirmation cancels
              today’s tests without changing pill history. These delivery tests ignore the Settings
              reminders toggle; the daily schedule follows it.
            </Text>
            <Text style={styles.copy}>
              For accurate timing, allow this app under Android Settings → Special app access →
              Alarms &amp; reminders. Android may delay closely spaced notifications while the phone
              is idle.
            </Text>
            <Text accessibilityLiveRegion="polite" style={styles.status}>
              {message}
            </Text>
            <Text style={styles.copy}>Pending test notifications: {pending ?? 'unavailable'}</Text>
            {actions.map(([action, label]) => (
              <Pressable
                key={action}
                accessibilityRole="button"
                disabled={busy || disabled}
                accessibilityState={{ disabled: busy || disabled, busy }}
                onPress={() => {
                  void run(action);
                }}
                style={({ pressed }) => [
                  styles.button,
                  (busy || disabled) && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.accent}>{label}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void Linking.openSettings();
              }}
              style={styles.button}
            >
              <Text style={styles.accent}>Open notification settings</Text>
            </Pressable>
          </View>
        ))}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 18,
    },
    heading: {
      minHeight: 48,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    title: { color: colors.text, fontSize: 17, fontWeight: '600' },
    accent: { color: colors.accent, fontSize: 13, fontWeight: '600', textAlign: 'center' },
    copy: { color: colors.muted, fontSize: 13, lineHeight: 21 },
    content: { gap: 12, paddingTop: 12 },
    status: { color: colors.text, fontSize: 13, lineHeight: 21 },
    button: {
      backgroundColor: colors.soft,
      minHeight: 48,
      borderRadius: 14,
      padding: 12,
      justifyContent: 'center',
    },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.7 },
  });
