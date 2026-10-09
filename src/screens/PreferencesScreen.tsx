import { DailyReminderInfo } from '../components/DailyReminderInfo';
import type { DailyReminderStatus } from '../reminders/dailyReminders';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  defaultPreferences,
  validatePreferences,
  type Preferences,
  type ThemeMode,
} from '../data/preferences';
import {
  nativePermissionsAvailable,
  notificationAccess,
  openAlarmAccess,
} from '../reminders/permissions';
import { reminderTimeLabel, routineTimeLabel } from '../reminders/routinePlan';
import { useTheme, type Palette } from '../theme';

interface Props {
  initial: Preferences;
  onboarding: boolean;
  onPreviewTheme: (theme: ThemeMode) => void;
  onSave: (preferences: Preferences) => Promise<void>;
  onCancel: () => void;
  reminderStatus: DailyReminderStatus | null;
  onRefreshReminders: () => Promise<void>;
}

export function PreferencesScreen({
  initial,
  onboarding,
  onPreviewTheme,
  onSave,
  onCancel,
  reminderStatus,
  onRefreshReminders,
}: Props) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState(0);
  const [firstHours, setFirstHours] = useState(String(initial.firstDelayMinutes / 60));
  const [criticalHours, setCriticalHours] = useState(String(initial.criticalDelayMinutes / 60));
  const [permission, setPermission] = useState('Checking notification access…');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);

  const refreshPermission = useCallback(() => {
    void notificationAccess().then(
      (message) => {
        if (mountedRef.current) setPermission(message);
      },
      () => {
        if (mountedRef.current)
          setPermission('Couldn’t check notification access. Please try again.');
      },
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refreshPermission();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermission();
    });
    return () => {
      mountedRef.current = false;
      listener.remove();
    };
  }, [refreshPermission]);

  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (busyRef.current) return true;
      if (!onboarding) {
        onCancel();
        return true;
      }
      if (step > 0) {
        setStep((value) => value - 1);
        return true;
      }
      return false;
    });
    return () => listener.remove();
  }, [onboarding, onCancel, step]);

  async function run(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      if (mountedRef.current)
        Alert.alert(
          'Please try again',
          error instanceof Error ? error.message : 'The change could not be saved.',
        );
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  }

  function chooseTime() {
    const date = new Date();
    date.setHours(draft.routineHour, draft.routineMinute, 0, 0);
    DateTimePickerAndroid.open({
      value: date,
      mode: 'time',
      onChange: (event, selected) => {
        if (event.type === 'set' && selected)
          setDraft((value) => ({
            ...value,
            routineHour: selected.getHours(),
            routineMinute: selected.getMinutes(),
          }));
      },
    });
  }

  async function save() {
    const updated = {
      ...draft,
      firstDelayMinutes: Number(firstHours.replace(',', '.')) * 60,
      criticalDelayMinutes: Number(criticalHours.replace(',', '.')) * 60,
    };
    validatePreferences(updated);
    await onSave(updated);
  }

  const preview = {
    ...draft,
    firstDelayMinutes: Number(firstHours.replace(',', '.')) * 60,
    criticalDelayMinutes: Number(criticalHours.replace(',', '.')) * 60,
  };
  const validPreview =
    Number.isInteger(preview.firstDelayMinutes) &&
    preview.firstDelayMinutes > 0 &&
    Number.isInteger(preview.criticalDelayMinutes) &&
    preview.criticalDelayMinutes > preview.firstDelayMinutes &&
    preview.criticalDelayMinutes <= 1440;

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>
        {onboarding ? `WELCOME · ${step + 1} OF 3` : 'YOUR PREFERENCES'}
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        {onboarding
          ? ['Make it yours.', 'Your daily pill time.', 'Stay reminded.'][step]
          : 'Settings'}
      </Text>
      {(!onboarding || step === 0) && (
        <View style={styles.card}>
          <Text style={styles.heading}>Appearance</Text>
          <Text style={styles.copy}>Choose what feels comfortable. You can change it anytime.</Text>
          <View style={styles.row}>
            {(['dark', 'light'] as const).map((theme) => (
              <Pressable
                key={theme}
                accessibilityRole="radio"
                accessibilityState={{ checked: draft.theme === theme, disabled: busy }}
                disabled={busy}
                onPress={() => {
                  setDraft((value) => ({ ...value, theme }));
                  onPreviewTheme(theme);
                }}
                style={[styles.choice, draft.theme === theme && styles.selected]}
              >
                <Text style={styles.buttonText}>
                  {draft.theme === theme ? '✓ ' : ''}
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      {(!onboarding || step === 1) && (
        <View style={styles.card}>
          <Text style={styles.heading}>Daily pill time</Text>
          <Text style={styles.copy}>Set the time you usually take your pills.</Text>
          {
            <ActionButton
              label={`${routineTimeLabel(draft)} · Change time`}
              onPress={chooseTime}
              primary={false}
              disabled={busy}
            />
          }
          <Text style={styles.copy}>
            No notification at this time. If you haven’t confirmed, the first reminder follows 1
            hour later and the critical reminder 6 hours later by default.
          </Text>
        </View>
      )}
      {!onboarding && (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.heading, styles.grow]}>Reminders</Text>
            <Switch
              accessibilityLabel="Enable reminders"
              value={draft.remindersEnabled}
              disabled={busy}
              onValueChange={(remindersEnabled) =>
                setDraft((value) => ({ ...value, remindersEnabled }))
              }
              trackColor={{ true: colors.accent }}
            />
          </View>
          <Text style={styles.copy}>Optional overrides, measured from your daily pill time.</Text>
          <Text style={styles.label}>First reminder · hours later</Text>
          <TextInput
            accessibilityLabel="First reminder delay in hours"
            editable={!busy}
            keyboardType="decimal-pad"
            value={firstHours}
            onChangeText={setFirstHours}
            style={styles.input}
            maxLength={6}
          />
          <Text style={styles.label}>Critical reminder · hours later</Text>
          <TextInput
            accessibilityLabel="Critical reminder delay in hours"
            editable={!busy}
            keyboardType="decimal-pad"
            value={criticalHours}
            onChangeText={setCriticalHours}
            style={styles.input}
            maxLength={6}
          />
          {
            <ActionButton
              label={'Restore 1-hour / 6-hour defaults'}
              onPress={() => {
                setFirstHours(String(defaultPreferences.firstDelayMinutes / 60));
                setCriticalHours(String(defaultPreferences.criticalDelayMinutes / 60));
              }}
              primary={false}
              disabled={busy}
            />
          }
          <Text style={styles.copy}>
            The critical reminder must follow the first. Maximum delay: 24 hours.
          </Text>
        </View>
      )}
      {(!onboarding || step >= 1) && (
        <View style={styles.card}>
          <Text style={styles.heading}>Your reminder plan</Text>
          <Text style={styles.copy}>
            {!draft.remindersEnabled
              ? 'Reminders are switched off.'
              : validPreview
                ? `First: ${reminderTimeLabel(preview, preview.firstDelayMinutes)}\nCritical: ${reminderTimeLabel(preview, preview.criticalDelayMinutes)}`
                : 'Enter valid delays to preview your reminder times.'}
          </Text>
          <Text style={styles.copy}>
            Confirming today cancels today’s reminders. Times that have already passed are skipped.
          </Text>
          <Text style={styles.notice}>
            Save your choices to apply this plan. Confirmed days and passed times are skipped.
          </Text>
        </View>
      )}
      {(!onboarding || step === 2) && (
        <View style={styles.card}>
          <Text style={styles.heading}>Permissions</Text>
          <Text accessibilityLiveRegion="polite" style={styles.copy}>
            {permission}
          </Text>
          {reminderStatus?.supported && (
            <Text style={styles.copy}>
              {reminderStatus.exactAllowed
                ? 'Alarms & reminders allowed'
                : 'Alarms & reminders access is off'}
            </Text>
          )}
          {nativePermissionsAvailable && (
            <>
              {
                <ActionButton
                  label={'Allow notifications'}
                  onPress={() => {
                    void run(async () => {
                      setPermission(await notificationAccess(true));
                      await onRefreshReminders();
                    });
                  }}
                  primary={false}
                  disabled={busy}
                />
              }
              {
                <ActionButton
                  label={'Open app settings'}
                  onPress={() => {
                    void run(() => Linking.openSettings());
                  }}
                  primary={false}
                  disabled={busy}
                />
              }
              <Text style={styles.copy}>
                For accurate reminder times, allow this app in Android’s Alarms & reminders
                settings. Android controls this permission.
              </Text>
              {
                <ActionButton
                  label={'Open Alarms & reminders'}
                  onPress={() => {
                    void run(openAlarmAccess);
                  }}
                  primary={false}
                  disabled={busy}
                />
              }
            </>
          )}
          <Text style={styles.copy}>
            You can continue without permissions and enable them later. Recording your pills always
            works.
          </Text>
        </View>
      )}
      {!onboarding && (
        <DailyReminderInfo
          status={reminderStatus}
          onRetry={() => {
            void onRefreshReminders().catch(() => undefined);
          }}
        />
      )}
      {onboarding && step < 2 ? (
        <ActionButton
          label={'Continue'}
          onPress={() => setStep((value) => value + 1)}
          primary={true}
          disabled={busy}
        />
      ) : (
        <ActionButton
          label={busy ? 'Saving…' : onboarding ? 'Finish setup' : 'Save settings'}
          onPress={() => {
            void run(save);
          }}
          primary={true}
          disabled={busy}
        />
      )}
      {onboarding ? (
        step > 0 && (
          <ActionButton
            label={'Back'}
            onPress={() => setStep((value) => value - 1)}
            primary={false}
            disabled={busy}
          />
        )
      ) : (
        <ActionButton label={'Cancel'} onPress={onCancel} primary={false} disabled={busy} />
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    page: {
      flexGrow: 1,
      padding: 24,
      gap: 20,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      paddingBottom: 40,
    },
    eyebrow: { color: colors.accent, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
    title: { color: colors.text, fontSize: 32, fontWeight: '700' },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      padding: 20,
      borderRadius: 24,
      gap: 16,
    },
    heading: { color: colors.text, fontSize: 18, fontWeight: '600' },
    copy: { color: colors.muted, fontSize: 14, lineHeight: 22 },
    notice: { color: colors.accent, fontSize: 13, lineHeight: 21 },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    grow: { flex: 1 },
    choice: {
      flex: 1,
      minHeight: 54,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.soft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selected: { borderColor: colors.accent, backgroundColor: colors.taken },
    button: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: colors.soft,
      padding: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: { color: colors.accent, fontSize: 15, fontWeight: '600', textAlign: 'center' },
    primary: { backgroundColor: colors.accent },
    primaryText: { color: colors.onAccent },
    dim: { opacity: 0.6 },
    label: { color: colors.text, fontSize: 14 },
    input: {
      color: colors.text,
      backgroundColor: colors.soft,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      minHeight: 52,
      fontSize: 16,
    },
  });

function ActionButton({
  label,
  onPress,
  primary,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary: boolean;
  disabled: boolean;
}) {
  const styles = makeStyles(useTheme());
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && styles.primary,
        (disabled || pressed) && styles.dim,
      ]}
    >
      <Text style={[styles.buttonText, primary && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}
