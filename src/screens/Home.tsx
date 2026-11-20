import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { Text } from '../ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pip } from '../ui/Pip';
import { Pond } from '../ui/Pond';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { PIPS, totalMl } from '../logic/hydration';
import { STAGES, moodFor, pipLine } from '../logic/vitality';
import { useStore } from '../store';

const AMOUNTS = [150, 250, 350, 500];

export function Home({ onSettings }: { onSettings: () => void }) {
  const { state, todayKey, goalToday, streak, vitality, addWater, undoLast } = useStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  const entries = state.log[todayKey] ?? [];
  const ml = totalMl(entries);
  const progress = ml / goalToday;
  const done = ml >= goalToday;
  const pip = PIPS.find((p) => p.id === state.activePip) ?? PIPS[0];
  const mood = moodFor({ ml, goalMl: goalToday, now, wakeHour: state.profile.wakeHour, sleepHour: state.profile.sleepHour, lastSipT: entries.length ? entries[entries.length - 1].t : undefined });
  const line = pipLine(pip.name, vitality, mood, goalToday - ml);
  const stageIdx = STAGES.findIndex((st) => st.id === vitality.stage.id);

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

        <Pond progress={progress} size={330}>
          <Pip def={pip} size={310} vitality={vitality.value} mood={mood} live sipKey={entries.length} />
        </Pond>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 40, fontWeight: '800', color: C.ink }}>{ml.toLocaleString()} ml</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.sub }}>{`of ${goalToday.toLocaleString()} ml today`}</Text>
        </View>

        <View accessible accessibilityLabel={`${pip.name} is ${vitality.stage.label}, ${vitality.value} out of 100. ${line.title}. ${line.hint}`} style={{ alignSelf: 'stretch', backgroundColor: C.card, borderRadius: 24, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>{line.title}</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: vitality.yesterdayDelta < 0 ? '#D2506E' : C.mint }}>{vitality.stage.label}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {STAGES.map((st, i) => (
              <View key={st.id} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: i <= stageIdx ? (stageIdx <= 1 ? '#E58AA0' : C.water) : C.line }} />
            ))}
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.sub }}>{line.hint}</Text>
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
