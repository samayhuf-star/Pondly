import * as Notifications from 'expo-notifications';
import { reminderCountFor, reminderTimes } from './logic/hydration';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const LINES = [
  'Bruno is thirsty. Time for a sip?',
  'A small glass now keeps the pond full.',
  'Quick sip break. Your pond is waiting.',
  'Water check: how about 250 ml?',
];

export async function enableReminders(wakeHour: number, sleepHour: number, goalMl: number): Promise<boolean> {
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  await scheduleReminders(wakeHour, sleepHour, goalMl);
  return true;
}

export async function scheduleReminders(wakeHour: number, sleepHour: number, goalMl: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const times = reminderTimes(wakeHour, sleepHour, reminderCountFor(goalMl));
  await Promise.all(
    times.map(({ hour, minute }, i) =>
      Notifications.scheduleNotificationAsync({
        content: { title: 'Pondly', body: LINES[i % LINES.length] },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      }),
    ),
  );
}

export async function disableReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
