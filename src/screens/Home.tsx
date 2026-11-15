import React from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { Text } from '../ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pip } from '../ui/Pip';
import { Pond } from '../ui/Pond';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { PIPS, dayKey, totalMl } from '../logic/hydration';
import { useStore } from '../store';

const AMOUNTS = [150, 250, 350, 500];

export function Home({ onSettings }: { onSettings: () => void }) {
  const { state, goalToday, streak, addWater, undoLast } = useStore();
  const entries = state.log[dayKey(new Date())] ?? [];
  const ml = totalMl(entries);
  const progress = ml / goalToday;
  const done = ml >= goalToday;
  const pip = PIPS.find((p) => p.id === state.activePip) ?? PIPS[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ fontWeight: '800', color: C.ink }}>{streak} day streak</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={{ minWidth: 44, minHeight: 44, borderRadius: 22, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontWeight: '800', color: C.blue }}>Settings</Text>
          </Pressable>
        </View>

        <Pond progress={progress} size={290}>
          <Pip def={pip} size={150} cheer={done} />
        </Pond>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 40, fontWeight: '800', color: C.ink }}>{ml.toLocaleString()} ml</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.sub }}>
            {done ? 'Goal reached. Pip is thrilled.' : `of ${goalToday.toLocaleString()} ml today`}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {AMOUNTS.map((a) => (
            <Button key={a} label={`+${a}`} kind="soft" onPress={() => addWater(a)} style={{ minWidth: 76 }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {entries.length > 0 && <Button label="Undo last" kind="ghost" onPress={undoLast} />}
          {done && <Button label="Share my goal" kind="primary" onPress={() => Share.share({ message: `I hit my ${goalToday.toLocaleString()} ml water goal today with Pondly. ${streak}-day streak.` })} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
