import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { Text } from './src/ui/Text';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './src/store';
import { Onboarding } from './src/screens/Onboarding';
import { Home } from './src/screens/Home';
import { Forecast } from './src/screens/Forecast';
import { Pips } from './src/screens/Pips';
import { Circles } from './src/screens/Circles';
import { Settings } from './src/screens/Settings';
import { initPurchases, isPro, onProChange } from './src/purchases';
import { initPush } from './src/push';
import { C } from './src/ui/theme';
import { useFonts } from 'expo-font';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';

type Tab = 'today' | 'forecast' | 'circles' | 'pips';
const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'circles', label: 'Circles' },
  { id: 'pips', label: 'Pips' },
];

function Root() {
  const { ready, state } = useStore();
  const [fontsLoaded, fontError] = useFonts({ Fredoka_700Bold, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  const [tab, setTab] = useState<Tab>('today');
  const [settings, setSettings] = useState(false);
  const [pro, setPro] = useState(false);

  useEffect(() => { initPurchases(); initPush(); isPro().then(setPro); return onProChange(setPro); }, []);

  if (!ready || (!fontsLoaded && !fontError)) return <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.blue} /></View>;
  if (!state.onboarded) return <Onboarding />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1 }}>
        {tab === 'today' && <Home onSettings={() => setSettings(true)} />}
        {tab === 'forecast' && <Forecast pro={pro} onPro={() => setPro(true)} />}
        {tab === 'circles' && <Circles />}
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
