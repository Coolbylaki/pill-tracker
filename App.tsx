import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getAppStorage, type AppStorage } from './src/data/database';
import { defaultPreferences, type Preferences, type ThemeMode } from './src/data/preferences';
import { HomeScreen } from './src/screens/HomeScreen';
import { PreferencesScreen } from './src/screens/PreferencesScreen';
import { paletteFor, ThemeContext } from './src/theme';

export default function App() {
  const [storage, setStorage] = useState<AppStorage | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const colors = paletteFor(theme);

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
  }

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={colors}>
        <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
          <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
          {storage ? (
            !preferences || settingsOpen ? (
              <PreferencesScreen
                initial={preferences ?? defaultPreferences}
                onboarding={!preferences}
                onPreviewTheme={setTheme}
                onSave={savePreferences}
                onCancel={() => {
                  setTheme(preferences?.theme ?? 'dark');
                  setSettingsOpen(false);
                }}
              />
            ) : (
              <HomeScreen
                repository={storage.pills}
                preferences={preferences}
                onOpenSettings={() => setSettingsOpen(true)}
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
