import React from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pip } from '../ui/Pip';
import { Pond } from '../ui/Pond';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { PIPS, dayKey, totalMl } from '../logic/hydration';
import { useStore } from '../store';

/**
 * Circles: private groups that share goal progress only, never what you drink.
 * Friend sync needs a backend that is not built yet, so this screen shows the
 * user's own progress and an invite link; no placeholder friends are shown.
 */
export function Circles() {
  const { state, goalToday } = useStore();
  const ml = totalMl(state.log[dayKey(new Date())] ?? []);
  const pct = Math.min(100, Math.round((ml / goalToday) * 100));
  const pip = PIPS.find((p) => p.id === state.activePip) ?? PIPS[0];

  const invite = () =>
    Share.share({ message: 'Join my Pondly Circle. We share goal progress only, never what we drink. https://samayhuf-star.github.io/app-legal/pondly/' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Circles</Text>
        <View style={{ backgroundColor: C.blueSoft, borderRadius: 28, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pond progress={ml / goalToday} size={96}><Pip def={pip} size={52} /></Pond>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink }}>You are at {pct}%</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.sub }}>Invite friends to fill one pond together.</Text>
          </View>
        </View>
        <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 18, gap: 8 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>How Circles work</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.sub }}>Friends see your goal progress only, never what you drink. One nudge per person per day.</Text>
        </View>
        <Button label="Invite a friend" onPress={invite} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.sub, textAlign: 'center' }}>Friends appear here once they join.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
