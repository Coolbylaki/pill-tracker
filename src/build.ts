import Constants from 'expo-constants';

export const isPersonalBuild = Constants.expoConfig?.extra?.personalBuild === true;
export const showReminderTests =
  !isPersonalBuild && (__DEV__ || Constants.expoConfig?.extra?.reminderTests === true);
