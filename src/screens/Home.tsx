import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { Text } from '../ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Capy } from '../ui/Capy';
import { Pond } from '../ui/Pond';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { SKINS, totalMl } from '../logic/hydration';
import { STAGES, moodFor, pipLine } from '../logic/vitality';
import { gearById } from '../logic/gear';
import { useStore } from '../store';

const AMOUNTS = [150, 250, 350, 500];

export function Home({ onSettings }: { onSettings: () => void }) {
  const { state, todayKey, goalToday, streak, vitality, level, chestReady, claimChest, addWater, undoLast } = useStore();
  const [prize, setPrize] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  const entries = state.log[todayKey] ?? [];
  const ml = totalMl(entries);
  const progress = ml / goalToday;
  const done = ml >= goalToday;
  const pip = SKINS.find((p) => p.id === state.activePip) ?? SKINS[0];
  const mood = moodFor({ ml, goalMl: goalToday, now, wakeHour: state.profile.wakeHour, sleepHour: state.profile.sleepHour, lastSipT: entries.length ? entries[entries.length - 1].t : undefined });
  const line = pipLine(state.petName || pip.name, vitality, mood, goalToday - ml);
  const stageIdx = STAGES.findIndex((st) => st.id === vitality.stage.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View accessible accessibilityLabel={`Level ${level.level}`} style={{ backgroundColor: C.ink, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Text style={{ fontWeight: '800', color: C.card }}>{`Lv ${level.level}`}</Text>
            </View>
            <View style={{ backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Text style={{ fontWeight: '800', color: C.ink }}>{streak} day streak</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={{ minWidth: 44, minHeight: 44, borderRadius: 22, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontWeight: '800', color: C.blue }}>Settings</Text>
          </Pressable>
        </View>

        <Pond progress={progress} size={330}>
          <Capy def={pip} size={310} vitality={vitality.value} mood={mood} live sipKey={entries.length} gear={state.equippedGear} />
        </Pond>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 40, fontWeight: '800', color: C.ink }}>{ml.toLocaleString()} ml</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.sub }}>{`of ${goalToday.toLocaleString()} ml today`}</Text>
        </View>

        <View accessible accessibilityLabel={`${pip.name} is ${vitality.stage.label}, ${vitality.value} out of 100. ${line.title}. ${line.hint}`} style={{ alignSelf: 'stretch', backgroundColor: C.card, borderRadius: 24, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>{line.title}</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: vitality.yesterdayDelta < 0 || stageIdx <= 1 ? '#D2506E' : C.mint }}>{vitality.stage.label}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {STAGES.map((st, i) => (
              <View key={st.id} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: i <= stageIdx ? (stageIdx <= 1 ? '#E58AA0' : C.water) : C.line }} />
            ))}
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.sub }}>{line.hint}</Text>
        </View>

        <View accessible accessibilityLabel={`${level.into} of ${level.span} XP to level ${level.level + 1}`} style={{ alignSelf: 'stretch', gap: 6 }}>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: C.line, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(level.pct * 100)}%`, height: 12, backgroundColor: C.water }} />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.sub }}>{`${level.into} / ${level.span} XP to level ${level.level + 1}`}</Text>
        </View>

        {(chestReady || prize) && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chestReady ? 'Open your daily chest' : 'Chest opened'}
            disabled={!chestReady}
            onPress={() => {
              const r = claimChest();
              if (r) setPrize(r.gearId ? `${gearById(r.gearId)?.name ?? 'New gear'} and ${r.xp} XP` : `${r.xp} bonus XP`);
            }}
            style={{ alignSelf: 'stretch', backgroundColor: C.card, borderRadius: 24, padding: 16, alignItems: 'center', gap: 4, borderWidth: 3, borderColor: chestReady ? C.water : C.line }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>{chestReady ? 'Daily chest ready. Tap to open' : 'Chest opened'}</Text>
            {prize && <Text style={{ fontSize: 15, fontWeight: '700', color: C.sub }}>{`You got ${prize}`}</Text>}
          </Pressable>
        )}

        <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
          {AMOUNTS.map((a) => (
            <Button key={a} label={`+${a}`} kind="soft" onPress={() => addWater(a)} style={{ flex: 1, paddingHorizontal: 4 }} />
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
