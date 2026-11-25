import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import { ONESIGNAL_APP_ID } from './config';

let started = false;

/** Starts OneSignal push. Does nothing until EXPO_PUBLIC_ONESIGNAL_APP_ID is set. */
export function initPush(): void {
  if (started || Platform.OS !== 'ios' || !ONESIGNAL_APP_ID) return;
  OneSignal.initialize(ONESIGNAL_APP_ID);
  started = true;
}

/** Tags for targeting, for example level or reminders_on. Never personal data. */
export function setPushTags(tags: Record<string, string>): void {
  if (!started) return;
  OneSignal.User.addTags(tags);
}
