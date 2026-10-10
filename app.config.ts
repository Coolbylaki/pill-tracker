import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const standaloneTest = process.env.APP_VARIANT === 'reminder-test';
  const personal = process.env.APP_VARIANT === 'personal';
  const standalone = standaloneTest || personal;
  return {
    ...config,
    name: personal ? 'Pill Tracker' : standaloneTest ? 'Pill Tracker Test' : 'Pill Tracker Dev',
    slug: 'pill-tracker',
    owner: 'coolbylaki',
    icon: './assets/pill-icon.png',
    // Keep the installed Test app's identity and notification links for in-place updates.
    scheme: standalone ? 'pill-tracker-test' : 'pill-tracker-dev',
    plugins: [
      ...(config.plugins ?? []),
      ['expo-dev-client', { addGeneratedScheme: !standalone }],
      ['expo-notifications', { color: '#9BF2CD', defaultChannel: 'pill-tracker-reminders' }],
      'expo-system-ui',
      '@react-native-community/datetimepicker',
      './plugins/with-reminder-desugaring.cjs',
    ],
    android: {
      ...config.android,
      adaptiveIcon: {
        foregroundImage: './assets/pill-icon-foreground.png',
        monochromeImage: './assets/pill-icon-foreground.png',
        backgroundColor: '#10231F',
      },
      versionCode: personal ? 4 : (config.android?.versionCode ?? 1),
      package: standalone ? 'com.coolbylaki.pilltracker.test' : 'com.coolbylaki.pilltracker.dev',
      permissions: [
        ...(config.android?.permissions ?? []),
        'android.permission.SCHEDULE_EXACT_ALARM',
      ],
    },
    extra: {
      ...config.extra,
      personalBuild: personal,
      reminderTests: !personal && process.env.EXPO_PUBLIC_REMINDER_TESTS === 'true',
    },
  };
};
