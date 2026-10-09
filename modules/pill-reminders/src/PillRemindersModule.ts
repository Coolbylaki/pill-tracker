import { requireOptionalNativeModule } from 'expo';
import type { PillRemindersNative } from './PillReminders.types';

export default requireOptionalNativeModule<PillRemindersNative>('PillReminders');
