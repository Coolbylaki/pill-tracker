import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getPillRepository } from './src/data/database';
import type { PillRepository } from './src/data/pills';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  const [repository, setRepository] = useState<PillRepository | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getPillRepository().then(
      (readyRepository) => {
        if (active) setRepository(readyRepository);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        {repository ? (
          <HomeScreen repository={repository} />
        ) : (
          <View style={styles.loading}>
            {failed ? (
              <>
                <Text style={styles.message}>We couldn’t open your records.</Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.retry}
                  onPress={() => {
                    setFailed(false);
                    setAttempt((value) => value + 1);
                  }}
                >
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </>
            ) : (
              <>
                <ActivityIndicator color="#9BF2CD" />
                <Text style={styles.message}>Opening your daily check-in…</Text>
              </>
            )}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1713' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  message: { color: '#B5C4BC', fontSize: 16, textAlign: 'center' },
  retry: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 24 },
  retryText: { color: '#9BF2CD', fontSize: 16, fontWeight: '600' },
});
