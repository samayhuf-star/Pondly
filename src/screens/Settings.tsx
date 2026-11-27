import React from 'react';
import { Alert, Linking, ScrollView, Switch, View } from 'react-native';
import { Text } from '../ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { useStore } from '../store';
import { disableReminders, enableReminders } from '../reminders';
import { openCustomerCenter, restore, showPaywall } from '../purchases';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '../config';
import { usePushConsent } from '../push';

export function Settings({ pro, onPro, onClose }: { pro: boolean; onPro: () => void; onClose: () => void }) {
  const { state, goalToday, update, reset } = useStore();
  const p = state.profile;
  const [tipsOn, setTipsOn] = usePushConsent();

  const toggle = async (on: boolean) => {
    if (on) {
      const ok = await enableReminders(p.wakeHour, p.sleepHour, goalToday);
      if (!ok) { Alert.alert('Notifications are blocked', 'Turn them on for Pondly in iOS Settings.', [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'OK' }]); return; }
      update({ remindersOn: true });
    } else { await disableReminders(); update({ remindersOn: false }); }
  };

  const doRestore = async () => {
    const ok = await restore();
    if (ok) { onPro(); Alert.alert('Restored', 'Pondly Pro is active.'); } else Alert.alert('Nothing to restore', 'No active Pondly Pro purchase was found for this Apple ID.');
  };

  const upgrade = async () => {
    const r = await showPaywall();
    if (r === 'purchased') onPro();
    else if (r === 'unavailable') Alert.alert('Pondly Pro', 'Pro is not available in this build yet.');
  };

  const confirmReset = () =>
    Alert.alert('Delete all data?', 'This removes your logs and settings from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await disableReminders(); reset(); onClose(); } },
    ]);

  const card = { backgroundColor: C.card, borderRadius: 24, padding: 18, gap: 12 } as const;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Settings</Text>
          <Button label="Done" kind="soft" onPress={onClose} />
        </View>
        <View style={card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', fontSize: 17, color: C.ink }}>Reminders</Text>
            <Switch accessibilityLabel="Reminders" value={state.remindersOn} onValueChange={toggle} />
          </View>
          <Text style={{ color: C.sub, fontWeight: '600' }}>Goal today: {goalToday.toLocaleString()} ml</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', fontSize: 17, color: C.ink }}>Tips and news</Text>
            <Switch accessibilityLabel="Tips and news" value={tipsOn} onValueChange={setTipsOn} />
          </View>
          <Text style={{ color: C.sub, fontSize: 12, lineHeight: 17 }}>Occasional hydration tips and Pondly news by push (OneSignal). Nothing is sent or collected unless this is on. OneSignal never receives your water log.</Text>
        </View>
        <View style={card}>
          <Text style={{ fontWeight: '800', fontSize: 17, color: C.ink }}>Pondly Pro</Text>
          <Text style={{ color: C.sub, fontWeight: '600' }}>{pro ? 'Active. Thank you!' : 'Apply the Thirst Forecast to your daily goal.'}</Text>
          {!pro && <Button label="See Pro options" onPress={upgrade} />}
          {pro && <Button label="Manage subscription" onPress={openCustomerCenter} />}
          <Button label="Restore Purchases" kind="soft" onPress={doRestore} />
          <Text style={{ color: C.sub, fontSize: 12, lineHeight: 17 }}>Pondly Pro is weekly, monthly or yearly with a 7-day free trial, or a one-time lifetime purchase. Subscriptions renew automatically at the price shown on the Pro screen until you cancel. Cancel any time in your Apple ID subscription settings, at least 24 hours before the period ends. See the Terms of Use and Privacy Policy below.</Text>
        </View>
        <View style={card}>
          <Button label="Privacy Policy" kind="ghost" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <Button label="Terms of Use" kind="ghost" onPress={() => Linking.openURL(TERMS_URL)} />
          <Button label="Contact support" kind="ghost" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Pondly%20support`)} />
          <Button label="Delete all my data" kind="ghost" onPress={confirmReset} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
