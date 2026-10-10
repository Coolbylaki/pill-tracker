import { DailyReminderInfo } from '../components/DailyReminderInfo';
import type { DailyReminderStatus } from '../reminders/dailyReminders';
import type { Preferences } from '../data/preferences';
import { routineTimeLabel } from '../reminders/routinePlan';
import { useTheme, type Palette } from '../theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MonthCalendar } from '../components/MonthCalendar';
import { ReminderTestPanel } from '../components/ReminderTestPanel';
import { showReminderTests } from '../build';
import { cancelTestReminders } from '../reminders/testNotifications';
import type { PillRecord, PillRepository } from '../data/pills';
import { dateFromKey, formatDay, formatTime, localDateKey } from '../utils/dates';

interface Props {
  repository: PillRepository;
  preferences: Preferences;
  onOpenSettings: () => void;
  reminderStatus: DailyReminderStatus | null;
  onRecordsChanged: () => Promise<void>;
}

export function HomeScreen({
  repository,
  preferences,
  onOpenSettings,
  reminderStatus,
  onRecordsChanged,
}: Props) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [today, setToday] = useState(() => new Date());
  const [record, setRecord] = useState<PillRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarRevision, setCalendarRevision] = useState(0);
  const busyRef = useRef(false);
  const dialogRef = useRef(false);
  const requestRef = useRef(0);
  const dateRef = useRef(localDateKey(today));

  const refresh = useCallback(() => {
    if (busyRef.current) return Promise.resolve();
    const request = ++requestRef.current;
    const now = new Date();
    const date = localDateKey(now);
    return repository
      .getRecord(date)
      .then((savedRecord) => {
        if (request !== requestRef.current) return;
        dateRef.current = date;
        setToday(now);
        setRecord(savedRecord);
        setError(null);
      })
      .catch(() => {
        if (request === requestRef.current) {
          setError('We couldn’t load today’s record. Please try again.');
        }
      })
      .finally(() => {
        if (request === requestRef.current) setLoading(false);
      });
  }, [repository]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    const timer = setInterval(() => {
      if (localDateKey(new Date()) !== dateRef.current) void refresh();
    }, 15_000);
    return () => {
      requestRef.current += 1;
      subscription.remove();
      clearInterval(timer);
    };
  }, [refresh]);

  async function write(action: 'confirm' | 'undo', expectedDate: string) {
    dialogRef.current = false;
    if (busyRef.current) return;
    const now = new Date();
    if (localDateKey(now) !== expectedDate) {
      Alert.alert('A new day has started', 'Please check today’s status and try again.');
      await refresh();
      return;
    }
    busyRef.current = true;
    requestRef.current += 1;
    setLoading(false);
    setBusy(true);
    setError(null);
    try {
      if (action === 'confirm') {
        await repository.confirm(now);
        try {
          if (showReminderTests) await cancelTestReminders(localDateKey(now));
        } catch {
          Alert.alert(
            'Pills recorded',
            'Your record is saved, but test reminders could not be canceled. Use Cancel all test notifications in the reminder test panel.',
          );
        }
      } else if (record) await repository.undo(record);
      try {
        await onRecordsChanged();
      } catch {
        Alert.alert(
          'Record saved',
          'Your pill record is saved, but reminders could not be updated. Please try updating reminders on the home screen.',
        );
      }
    } catch {
      Alert.alert('Couldn’t save the change', 'Please check your status and try again.');
    } finally {
      busyRef.current = false;
      await refresh();
      setCalendarRevision((value) => value + 1);
      setBusy(false);
    }
  }

  function openConfirmation(action: 'confirm' | 'undo') {
    if (dialogRef.current || busyRef.current || loading || error) return;
    const expectedDate = localDateKey(today);
    if (localDateKey(new Date()) !== expectedDate) {
      void refresh();
      return;
    }
    dialogRef.current = true;
    const dismiss = () => {
      dialogRef.current = false;
    };
    Alert.alert(
      action === 'confirm' ? 'Taken your pills today?' : 'Remove today’s record?',
      action === 'confirm'
        ? 'Confirm only after you’ve taken your pills.'
        : 'This removes today’s record. It doesn’t change any previous day.',
      [
        { text: 'Cancel', style: 'cancel', onPress: dismiss },
        {
          text: action === 'confirm' ? 'Yes, taken' : 'Remove record',
          style: action === 'undo' ? 'destructive' : 'default',
          onPress: () => {
            void write(action, expectedDate);
          },
        },
      ],
      { cancelable: true, onDismiss: dismiss },
    );
  }

  async function saveCorrection(dateKey: string, existing: PillRecord | null) {
    dialogRef.current = false;
    if (busyRef.current) return;
    busyRef.current = true;
    requestRef.current += 1;
    setBusy(true);
    try {
      const now = new Date();
      if (existing) await repository.undo(existing, now);
      else await repository.markDateTaken(dateKey, now);
      try {
        await onRecordsChanged();
      } catch {
        Alert.alert(
          'Correction saved',
          'Your correction is saved, but reminders could not be updated. Please try updating reminders on the home screen.',
        );
      }
    } catch {
      Alert.alert('Couldn’t save the correction', 'Please check the selected date and try again.');
    } finally {
      busyRef.current = false;
      await refresh();
      setCalendarRevision((value) => value + 1);
      setBusy(false);
    }
  }

  function openDateCorrection(dateKey: string, existing: PillRecord | null) {
    if (dialogRef.current || busyRef.current || loading || error) return;
    const currentDate = localDateKey(new Date());
    if (dateKey > currentDate) return;
    if (dateKey === currentDate) {
      openConfirmation(record ? 'undo' : 'confirm');
      return;
    }
    dialogRef.current = true;
    const label = dateFromKey(dateKey).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const dismiss = () => {
      dialogRef.current = false;
    };
    Alert.alert(
      existing ? `Remove the record for ${label}?` : `Mark ${label} as taken?`,
      existing
        ? 'This removes only the selected day’s record.'
        : 'Confirm only if you took your pills on this date. No pill-taking time will be added.',
      [
        { text: 'Cancel', style: 'cancel', onPress: dismiss },
        {
          text: existing ? 'Remove record' : 'Mark as taken',
          style: existing ? 'destructive' : 'default',
          onPress: () => {
            void saveCorrection(dateKey, existing);
          },
        },
      ],
      { cancelable: true, onDismiss: dismiss },
    );
  }

  const disabled = loading || busy || !!error || !!record;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View style={styles.cardTop}>
          <Text style={styles.brand}>PILL TRACKER</Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy || loading}
            onPress={onOpenSettings}
            style={styles.settingsButton}
          >
            <Text style={styles.retryText}>Settings</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>A little peace{'\n'}of mind.</Text>
        <Text style={styles.subtitle}>One daily check-in. One less thing to remember.</Text>
        <Text style={styles.subtitle}>Daily pill time: {routineTimeLabel(preferences)}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.eyebrow}>TODAY</Text>
          <View style={[styles.badge, record && !loading && !error && styles.badgeTaken]}>
            <Text style={[styles.badgeText, record && !loading && !error && styles.badgeTextTaken]}>
              {loading ? 'Checking' : error ? 'Unavailable' : record ? 'Taken' : 'Not recorded'}
            </Text>
          </View>
        </View>
        <Text style={styles.date}>{formatDay(today)}</Text>

        <View style={styles.status} accessibilityLiveRegion="polite">
          <View style={[styles.symbol, record && styles.symbolTaken]}>
            {loading || busy ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.symbolText}>{record && !error ? '✓' : '＋'}</Text>
            )}
          </View>
          <Text style={styles.statusTitle}>
            {loading
              ? 'Checking today…'
              : error
                ? 'Let’s try again'
                : record
                  ? 'You’re all set.'
                  : 'Your daily check-in'}
          </Text>
          <Text style={styles.statusDescription}>
            {error ??
              (loading
                ? 'Just a moment.'
                : record
                  ? record.takenAt
                    ? `Taken today at ${formatTime(record.takenAt)}`
                    : 'Marked as taken today'
                  : 'After taking your pills, record it here.')}
          </Text>
        </View>

        {error ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void refresh();
            }}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={record ? 'Pills already recorded for today' : 'I’ve taken my pills'}
            accessibilityHint="Opens a confirmation before saving today’s record"
            accessibilityState={{ disabled, busy: loading || busy }}
            disabled={disabled}
            onPress={() => openConfirmation('confirm')}
            style={({ pressed }) => [
              styles.button,
              record && styles.buttonTaken,
              (loading || busy) && styles.buttonLoading,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.buttonText, record && styles.buttonTextTaken]}>
              {busy
                ? 'Saving…'
                : loading
                  ? 'Please wait…'
                  : record
                    ? '✓  Taken today'
                    : 'I’ve taken my pills'}
            </Text>
          </Pressable>
        )}

        {!!record && !loading && !error && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => openConfirmation('undo')}
            style={styles.undo}
          >
            <Text style={styles.undoText}>Made a mistake? Undo</Text>
          </Pressable>
        )}
      </View>

      <DailyReminderInfo
        status={reminderStatus}
        onRetry={() => {
          void onRecordsChanged().catch(() => undefined);
        }}
      />

      <MonthCalendar
        repository={repository}
        today={today}
        revision={calendarRevision}
        editingDisabled={loading || busy || !!error}
        onSelectDate={openDateCorrection}
      />

      {showReminderTests && <ReminderTestPanel disabled={loading || busy || !!error} />}

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.dot} />
          <Text style={styles.footerText}>Your record stays on this device.</Text>
        </View>
        <Text style={styles.footerText}>Home-screen widget available.</Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    page: {
      flexGrow: 1,
      padding: 24,
      paddingTop: 32,
      gap: 32,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    header: { gap: 12 },
    settingsButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
    brand: { color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 3 },
    title: {
      color: colors.text,
      fontSize: 40,
      fontWeight: '700',
      letterSpacing: -1.4,
      lineHeight: 46,
    },
    subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, maxWidth: 300 },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 28,
      padding: 24,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    },
    eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
    badge: {
      backgroundColor: colors.soft,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    badgeTaken: { backgroundColor: colors.taken },
    badgeText: { color: colors.secondary, fontSize: 11, fontWeight: '600' },
    badgeTextTaken: { color: colors.accent },
    date: { color: colors.text, fontSize: 20, fontWeight: '600', marginTop: 18 },
    status: { alignItems: 'center', paddingVertical: 36, gap: 10 },
    symbol: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 1,
      borderColor: colors.symbolBorder,
      backgroundColor: colors.symbol,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    symbolTaken: { backgroundColor: colors.taken, borderColor: colors.takenBorder },
    symbolText: { color: colors.accent, fontSize: 32 },
    statusTitle: { color: colors.text, fontSize: 22, fontWeight: '600', textAlign: 'center' },
    statusDescription: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
    button: {
      minHeight: 76,
      borderRadius: 20,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 18,
    },
    buttonTaken: {
      backgroundColor: colors.buttonTaken,
      borderColor: colors.buttonBorder,
      borderWidth: 1,
    },
    buttonLoading: { opacity: 0.6 },
    buttonText: { color: colors.onAccent, fontSize: 18, fontWeight: '700', textAlign: 'center' },
    buttonTextTaken: { color: colors.accent },
    pressed: { opacity: 0.8 },
    undo: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      padding: 8,
    },
    undoText: {
      color: colors.secondary,
      fontSize: 13,
      textDecorationLine: 'underline',
      textAlign: 'center',
    },
    retry: {
      minHeight: 64,
      borderRadius: 20,
      backgroundColor: colors.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
    footer: {
      alignItems: 'center',
      gap: 8,
      paddingBottom: 12,
    },
    footerRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
    footerText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  });
