import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const standaloneTest = process.env.APP_VARIANT === 'reminder-test';
  return {
    ...config,
    name: standaloneTest ? 'Pill Tracker Test' : 'Pill Tracker Dev',
    slug: 'pill-tracker',
    owner: 'coolbylaki',
    scheme: standaloneTest ? 'pill-tracker-test' : 'pill-tracker-dev',
    plugins: [
      ...(config.plugins ?? []),
      ['expo-dev-client', { addGeneratedScheme: !standaloneTest }],
      ['expo-notifications', { color: '#9BF2CD', defaultChannel: 'pill-tracker-reminder-tests' }],
      'expo-system-ui',
      '@react-native-community/datetimepicker',
    ],
    android: {
      ...config.android,
      package: standaloneTest
        ? 'com.coolbylaki.pilltracker.test'
        : 'com.coolbylaki.pilltracker.dev',
      permissions: [
        ...(config.android?.permissions ?? []),
        'android.permission.SCHEDULE_EXACT_ALARM',
      ],
    },
    extra: { ...config.extra, reminderTests: process.env.EXPO_PUBLIC_REMINDER_TESTS === 'true' },
  };
};
