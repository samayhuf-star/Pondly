import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './src/store';
import { Onboarding } from './src/screens/Onboarding';
import { Home } from './src/screens/Home';
import { Forecast } from './src/screens/Forecast';
import { Pips } from './src/screens/Pips';
import { Settings } from './src/screens/Settings';
import { initPurchases, isPro } from './src/purchases';
import { C } from './src/ui/theme';

type Tab = 'today' | 'forecast' | 'pips';
const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'pips', label: 'Pips' },
];

function Root() {
  const { ready, state } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [settings, setSettings] = useState(false);
  const [pro, setPro] = useState(false);

  useEffect(() => { initPurchases(); isPro().then(setPro); }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.blue} /></View>;
  if (!state.onboarded) return <Onboarding />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1 }}>
        {tab === 'today' && <Home onSettings={() => setSettings(true)} />}
        {tab === 'forecast' && <Forecast pro={pro} onPro={() => setPro(true)} />}
        {tab === 'pips' && <Pips />}
      </View>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: C.card }}>
        <View style={{ flexDirection: 'row' }}>
          {TABS.map((t) => (
            <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} onPress={() => setTab(t.id)} style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontWeight: '800', fontSize: 15, color: tab === t.id ? C.blue : C.sub }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
      <Modal visible={settings} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSettings(false)}>
        <Settings pro={pro} onPro={() => setPro(true)} onClose={() => setSettings(false)} />
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
