import { useTheme, type Palette } from '../theme';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PillRecord, PillRepository } from '../data/pills';
import { calendarWeeks, monthStart, shiftMonth } from '../utils/calendar';
import { localDateKey } from '../utils/dates';

interface Props {
  repository: PillRepository;
  today: Date;
  revision: number;
  editingDisabled: boolean;
  onSelectDate: (dateKey: string, record: PillRecord | null) => void;
}

interface MonthResult {
  key: string;
  records: PillRecord[];
  failed: boolean;
}

const weekdays = Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 1 + index, 12));

export function MonthCalendar({
  repository,
  today,
  revision,
  editingDisabled,
  onSelectDate,
}: Props) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const month = useMemo(() => selectedMonth ?? monthStart(today), [selectedMonth, today]);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<MonthResult | null>(null);
  const key = `${localDateKey(month)}:${today.getTime()}:${attempt}:${revision}`;
  const currentResult = result?.key === key ? result : null;
  const todayKey = localDateKey(today);
  const isCurrentMonth = localDateKey(month) === localDateKey(monthStart(today));
  const confirmed = new Set(
    currentResult?.records
      .filter((record) => record.routineDate <= todayKey)
      .map((record) => record.routineDate),
  );

  useEffect(() => {
    let active = true;
    repository.getMonthRecords(month).then(
      (records) => {
        if (active) setResult({ key, records, failed: false });
      },
      () => {
        if (active) setResult({ key, records: [], failed: true });
      },
    );
    return () => {
      active = false;
    };
  }, [repository, month, key]);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>YOUR HISTORY</Text>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.month}>
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <View style={styles.navigation}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            hitSlop={4}
            onPress={() => setSelectedMonth((value) => shiftMonth(value ?? month, -1))}
            style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
          >
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            hitSlop={4}
            onPress={() => setSelectedMonth((value) => shiftMonth(value ?? month, 1))}
            style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
          >
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>
      </View>

      {!isCurrentMonth && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setSelectedMonth(null)}
          style={styles.returnButton}
        >
          <Text style={styles.returnText}>Back to this month</Text>
        </Pressable>
      )}

      {!currentResult ? (
        <View style={styles.message}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.muted}>Loading your history…</Text>
        </View>
      ) : currentResult.failed ? (
        <View style={styles.message}>
          <Text style={styles.muted}>We couldn’t load this month.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAttempt((value) => value + 1)}
            style={styles.returnButton}
          >
            <Text style={styles.returnText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.row}>
            {weekdays.map((day, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text
                  accessibilityLabel={day.toLocaleDateString(undefined, { weekday: 'long' })}
                  style={styles.weekday}
                >
                  {day.toLocaleDateString(undefined, { weekday: 'narrow' })}
                </Text>
              </View>
            ))}
          </View>
          {calendarWeeks(month).map((week, weekIndex) => (
            <View key={weekIndex} style={styles.row}>
              {week.map((day, dayIndex) => {
                if (!day) return <View key={`blank-${dayIndex}`} style={styles.dayCell} />;
                const future = day.dateKey > todayKey;
                const taken = confirmed.has(day.dateKey) && !future;
                const isToday = day.dateKey === todayKey;
                const label = `${day.date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}${isToday ? ', today' : ''}, ${future ? 'future date' : taken ? 'pills recorded' : 'not recorded'}`;
                return (
                  <Pressable
                    key={day.dateKey}
                    style={({ pressed }) => [styles.dayCell, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityHint={
                      future ? undefined : 'Opens a confirmation to correct this date'
                    }
                    accessibilityState={{ disabled: future || editingDisabled }}
                    disabled={future || editingDisabled}
                    onPress={() =>
                      onSelectDate(
                        day.dateKey,
                        currentResult.records.find(
                          (record) => record.routineDate === day.dateKey,
                        ) ?? null,
                      )
                    }
                  >
                    <View
                      style={[styles.day, taken && styles.takenDay, isToday && styles.todayDay]}
                    >
                      <Text
                        maxFontSizeMultiplier={1.5}
                        style={[
                          styles.dayNumber,
                          future && styles.futureNumber,
                          taken && styles.takenNumber,
                        ]}
                      >
                        {day.number}
                      </Text>
                      <Text
                        maxFontSizeMultiplier={1.5}
                        style={[styles.marker, taken && styles.takenMarker]}
                      >
                        {taken ? '✓' : future ? ' ' : '·'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
          <Text accessibilityLiveRegion="polite" style={styles.summary}>
            {confirmed.size} {confirmed.size === 1 ? 'day' : 'days'} recorded this month
          </Text>
          <Text style={styles.editHint}>Tap a past date to correct its record.</Text>
          <View style={styles.legend}>
            <Text style={styles.legendItem}>
              <Text style={styles.tick}>✓</Text> Recorded
            </Text>
            <Text style={styles.legendItem}>· Not recorded</Text>
            <Text style={styles.legendItem}>
              <Text style={styles.tick}>○</Text> Today
            </Text>
          </View>
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
      borderRadius: 28,
      padding: 18,
    },
    eyebrow: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: 12,
    },
    heading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 14,
    },
    month: { color: colors.text, fontSize: 20, fontWeight: '600', flexShrink: 1 },
    navigation: { flexDirection: 'row', gap: 6 },
    arrow: {
      width: 48,
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: colors.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowText: { color: colors.accent, fontSize: 30 },
    pressed: { opacity: 0.7 },
    returnButton: {
      minHeight: 48,
      justifyContent: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 4,
      marginBottom: 6,
    },
    returnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
    row: { flexDirection: 'row' },
    weekdayCell: { flex: 1, alignItems: 'center', paddingBottom: 8 },
    weekday: { color: colors.muted, fontSize: 11, fontWeight: '600' },
    dayCell: { flex: 1, padding: 2 },
    day: {
      minHeight: 54,
      paddingVertical: 6,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    takenDay: { backgroundColor: colors.taken },
    todayDay: { borderColor: colors.accent },
    dayNumber: { color: colors.day, fontSize: 13, fontWeight: '500' },
    futureNumber: { color: colors.future },
    takenNumber: { color: colors.accent, fontWeight: '700' },
    marker: { color: colors.muted, fontSize: 12, minHeight: 18 },
    takenMarker: { color: colors.accent },
    editHint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },
    summary: { color: colors.day, fontSize: 13, marginTop: 18, textAlign: 'center' },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
      marginTop: 14,
    },
    legendItem: { color: colors.muted, fontSize: 11 },
    tick: { color: colors.accent },
    message: { minHeight: 180, justifyContent: 'center', alignItems: 'center', gap: 14 },
    muted: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  });
