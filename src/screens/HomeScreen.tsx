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
import type { PillRecord, PillRepository } from '../data/pills';
import { formatDay, formatTime, localDateKey } from '../utils/dates';

interface Props {
  repository: PillRepository;
}

export function HomeScreen({ repository }: Props) {
  const [today, setToday] = useState(() => new Date());
  const [record, setRecord] = useState<PillRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (action === 'confirm') await repository.confirm(now);
      else if (record) await repository.undo(record);
    } catch {
      Alert.alert('Couldn’t save the change', 'Please check your status and try again.');
    } finally {
      busyRef.current = false;
      await refresh();
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
      action === 'confirm' ? 'Taken your pills today?' : 'Undo today’s confirmation?',
      action === 'confirm'
        ? 'Confirm only after you’ve taken your pills.'
        : 'This removes today’s record. It doesn’t change any previous day.',
      [
        { text: 'Cancel', style: 'cancel', onPress: dismiss },
        {
          text: action === 'confirm' ? 'Yes, taken' : 'Undo confirmation',
          style: action === 'undo' ? 'destructive' : 'default',
          onPress: () => {
            void write(action, expectedDate);
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
        <Text style={styles.brand}>PILL TRACKER</Text>
        <Text style={styles.title}>A little peace{'\n'}of mind.</Text>
        <Text style={styles.subtitle}>One daily check-in. One less thing to remember.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.eyebrow}>TODAY</Text>
          <View style={[styles.badge, record && !loading && !error && styles.badgeTaken]}>
            <Text style={[styles.badgeText, record && !loading && !error && styles.badgeTextTaken]}>
              {loading ? 'Checking' : error ? 'Unavailable' : record ? 'Confirmed' : 'Not recorded'}
            </Text>
          </View>
        </View>
        <Text style={styles.date}>{formatDay(today)}</Text>

        <View style={styles.status} accessibilityLiveRegion="polite">
          <View style={[styles.symbol, record && styles.symbolTaken]}>
            {loading || busy ? (
              <ActivityIndicator color="#9BF2CD" />
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
                  ? `Taken today at ${formatTime(record.takenAt)}`
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

      <MonthCalendar repository={repository} today={today} />

      <View style={styles.footer}>
        <View style={styles.dot} />
        <Text style={styles.footerText}>Your record stays on this device.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  brand: { color: '#9BF2CD', fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  title: { color: '#F1F5F2', fontSize: 40, fontWeight: '700', letterSpacing: -1.4, lineHeight: 46 },
  subtitle: { color: '#A5B3AD', fontSize: 15, lineHeight: 23, maxWidth: 300 },
  card: {
    backgroundColor: '#17221F',
    borderColor: '#2B3B34',
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
  eyebrow: { color: '#A5B3AD', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  badge: {
    backgroundColor: '#26342E',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeTaken: { backgroundColor: '#234235' },
  badgeText: { color: '#B5C4BC', fontSize: 11, fontWeight: '600' },
  badgeTextTaken: { color: '#9BF2CD' },
  date: { color: '#F1F5F2', fontSize: 20, fontWeight: '600', marginTop: 18 },
  status: { alignItems: 'center', paddingVertical: 36, gap: 10 },
  symbol: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#3C5147',
    backgroundColor: '#23332B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  symbolTaken: { backgroundColor: '#234235', borderColor: '#477E63' },
  symbolText: { color: '#9BF2CD', fontSize: 32 },
  statusTitle: { color: '#F1F5F2', fontSize: 22, fontWeight: '600', textAlign: 'center' },
  statusDescription: { color: '#A5B3AD', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  button: {
    minHeight: 76,
    borderRadius: 20,
    backgroundColor: '#9BF2CD',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  buttonTaken: { backgroundColor: '#233C30', borderColor: '#3D604C', borderWidth: 1 },
  buttonLoading: { opacity: 0.6 },
  buttonText: { color: '#10231A', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  buttonTextTaken: { color: '#9BF2CD' },
  pressed: { opacity: 0.8 },
  undo: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 8,
  },
  undoText: {
    color: '#B5C4BC',
    fontSize: 13,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  retry: {
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: '#26342E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: '#9BF2CD', fontSize: 16, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#9BF2CD' },
  footerText: { color: '#A5B3AD', fontSize: 12, flexShrink: 1 },
});
