import {
  reconcileDailyReminders,
  readDailyReminderStatus,
  hasDailyReminders,
  type DailyReminderStatus,
} from './src/reminders/dailyReminders';
import { reminderOpensHome } from './src/reminders/notificationRoute';
import { localDateKey } from './src/utils/dates';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getAppStorage, type AppStorage } from './src/data/database';
import { defaultPreferences, type Preferences, type ThemeMode } from './src/data/preferences';
import { HomeScreen } from './src/screens/HomeScreen';
import { PreferencesScreen } from './src/screens/PreferencesScreen';
import { paletteFor, ThemeContext } from './src/theme';
import { isPersonalBuild } from './src/build';
import { cancelTestReminders } from './src/reminders/testNotifications';

export default function App() {
  const [storage, setStorage] = useState<AppStorage | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const visibleTheme = settingsOpen || !preferences ? theme : preferences.theme;
  const colors = paletteFor(visibleTheme);
  const [reminderStatus, setReminderStatus] = useState<DailyReminderStatus | null>(null);
  const scheduleRequest = useRef(0);
  const syncReminders = useCallback(async () => {
    const request = ++scheduleRequest.current;
    setReminderStatus(null);
    try {
      const status = await reconcileDailyReminders();
      if (request === scheduleRequest.current) setReminderStatus(status);
    } catch {
      const status = await readDailyReminderStatus().catch(() => ({
        supported: hasDailyReminders,
        enabled: false,
        notificationsAllowed: false,
        exactAllowed: false,
        scheduled: [],
        error: 'Daily reminders could not be updated. Please try again.',
      }));
      if (request !== scheduleRequest.current) return;
      setReminderStatus({
        ...status,
        error: status.error ?? 'Daily reminders could not be updated. Please try again.',
      });
      throw new Error('Daily reminders could not be updated. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (!storage || !isPersonalBuild) return;
    async function clearOldTests() {
      try {
        await cancelTestReminders();
      } catch {
        Alert.alert(
          'Couldn’t clear old test notifications',
          'Your records and daily reminders are unchanged. Try again to remove leftover delivery tests from the previous app.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Try again', onPress: () => void clearOldTests() },
          ],
        );
      }
    }
    void clearOldTests();
  }, [storage]);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (reminderOpensHome(url)) setSettingsOpen(false);
    };
    void Linking.getInitialURL()
      .then(handleUrl)
      .catch(() => undefined);
    const listener = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (!storage) return;
    const update = () => {
      void syncReminders().catch(() => undefined);
    };
    update();
    let date = localDateKey(new Date());
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });
    const timer = setInterval(() => {
      const currentDate = localDateKey(new Date());
      if (currentDate !== date) {
        date = currentDate;
        update();
      } else if (AppState.currentState === 'active') {
        const request = scheduleRequest.current;
        void readDailyReminderStatus()
          .then((status) => {
            if (request === scheduleRequest.current) setReminderStatus(status);
          })
          .catch(() => undefined);
      }
    }, 15_000);
    return () => {
      listener.remove();
      clearInterval(timer);
    };
  }, [storage, syncReminders]);

  useEffect(() => {
    let active = true;
    void getAppStorage()
      .then(async (readyStorage) => {
        const saved = await readyStorage.preferences.load();
        if (!active) return;
        setPreferences(saved);
        setTheme(saved?.theme ?? 'dark');
        setStorage(readyStorage);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  async function savePreferences(value: Preferences) {
    if (!storage) throw new Error('Your preferences are still loading.');
    await storage.preferences.save(value);
    setPreferences(value);
    setTheme(value.theme);
    setSettingsOpen(false);
    try {
      await syncReminders();
    } catch {
      Alert.alert(
        'Settings saved',
        'Your settings are saved, but the reminder schedule could not be updated. Please try updating reminders on the home screen.',
      );
    }
  }

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={colors}>
        <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
          <StatusBar style={visibleTheme === 'light' ? 'dark' : 'light'} />
          {storage ? (
            !preferences || settingsOpen ? (
              <PreferencesScreen
                initial={preferences ?? defaultPreferences}
                onboarding={!preferences}
                onPreviewTheme={setTheme}
                onSave={savePreferences}
                reminderStatus={reminderStatus}
                onRefreshReminders={syncReminders}
                onCancel={() => {
                  setTheme(preferences?.theme ?? 'dark');
                  setSettingsOpen(false);
                }}
              />
            ) : (
              <HomeScreen
                repository={storage.pills}
                preferences={preferences}
                reminderStatus={reminderStatus}
                onRecordsChanged={syncReminders}
                onOpenSettings={() => {
                  setTheme(preferences.theme);
                  setSettingsOpen(true);
                }}
              />
            )
          ) : (
            <View style={styles.loading}>
              {failed ? (
                <>
                  <Text style={[styles.message, { color: colors.secondary }]}>
                    We couldn’t open your records and preferences.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    style={styles.retry}
                    onPress={() => {
                      setFailed(false);
                      setAttempt((value) => value + 1);
                    }}
                  >
                    <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>
                      Try again
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={[styles.message, { color: colors.secondary }]}>
                    Opening your daily check-in…
                  </Text>
                </>
              )}
            </View>
          )}
        </SafeAreaView>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  message: { fontSize: 16, textAlign: 'center' },
  retry: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 24 },
});
