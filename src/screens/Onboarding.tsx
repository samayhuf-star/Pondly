import React, { useState } from 'react';
import { Alert, ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pip } from '../ui/Pip';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { PIPS, Activity, baseGoalMl, reminderCountFor } from '../logic/hydration';
import { useStore } from '../store';
import { enableReminders } from '../reminders';

const ACTIVITIES: { id: Activity; label: string }[] = [
  { id: 'low', label: 'Mostly sitting' },
  { id: 'moderate', label: 'Some movement' },
  { id: 'high', label: 'Very active' },
];

function Stepper({ label, value, unit, onChange, min, max, step = 1 }: { label: string; value: number; unit: string; onChange: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: C.ink, fontWeight: '800', fontSize: 17 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - step))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.blue, fontSize: 24, fontWeight: '800' }}>−</Text>
        </Pressable>
        <Text style={{ minWidth: 70, textAlign: 'center', color: C.ink, fontWeight: '800', fontSize: 18 }}>{value} {unit}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + step))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.blue, fontSize: 24, fontWeight: '800' }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? ' am' : ' pm'}`;

export function Onboarding() {
  const { state, update, addWater } = useStore();
  const [step, setStep] = useState(0);
  const [sipped, setSipped] = useState(false);
  const p = state.profile;
  const goal = baseGoalMl(p);

  const finish = async (withReminders: boolean) => {
    let on = false;
    if (withReminders) {
      on = await enableReminders(p.wakeHour, p.sleepHour, goal);
      if (!on) Alert.alert('Reminders are off', 'You can turn them on any time in Settings.');
    }
    update({ onboarded: true, remindersOn: on });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.sky }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18, flexGrow: 1 }}>
        {step === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingTop: 40 }}>
            <Pip def={PIPS[0]} size={190} cheer={sipped} />
            <Text style={{ fontSize: 34, fontWeight: '800', color: C.ink, textAlign: 'center' }}>Meet Pip</Text>
            <Text style={{ fontSize: 18, color: C.sub, textAlign: 'center', fontWeight: '600' }}>Every sip fills Pip's pond. Try one.</Text>
            {!sipped ? (
              <Button label="Sip 250 ml" onPress={() => { setSipped(true); }} style={{ alignSelf: 'stretch' }} />
            ) : (
              <>
                <Text style={{ fontSize: 20, fontWeight: '800', color: C.blue }}>Nice. Pip says thanks.</Text>
                <Button label="Continue" onPress={() => setStep(1)} style={{ alignSelf: 'stretch' }} />
              </>
            )}
          </View>
        )}
        {step === 1 && (
          <>
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>A few quick questions</Text>
            <Text style={{ fontSize: 16, color: C.sub, fontWeight: '600' }}>This sets your daily goal. You can change it later.</Text>
            <Stepper label="Weight" value={p.weightKg} unit="kg" min={30} max={200} onChange={(n) => update({ profile: { ...p, weightKg: n } })} />
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink, marginTop: 4 }}>Activity</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {ACTIVITIES.map((a) => (
                <Pressable key={a.id} accessibilityRole="button" accessibilityState={{ selected: p.activity === a.id }} onPress={() => update({ profile: { ...p, activity: a.id } })}
                  style={{ paddingHorizontal: 16, minHeight: 48, borderRadius: 24, justifyContent: 'center', backgroundColor: p.activity === a.id ? C.blue : C.card }}>
                  <Text style={{ fontWeight: '800', color: p.activity === a.id ? '#fff' : C.ink }}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
            <Stepper label="I wake at" value={p.wakeHour} unit="h" min={4} max={12} onChange={(n) => update({ profile: { ...p, wakeHour: n } })} />
            <Stepper label="I sleep at" value={p.sleepHour} unit="h" min={20} max={26} onChange={(n) => update({ profile: { ...p, sleepHour: n % 24 } })} />
            <Button label="Continue" onPress={() => setStep(2)} />
          </>
        )}
        {step === 2 && (
          <View style={{ flex: 1, alignItems: 'center', gap: 16, paddingTop: 24 }}>
            <Pip def={PIPS[0]} size={140} cheer />
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Your plan is ready</Text>
            <View style={{ backgroundColor: C.card, borderRadius: 28, padding: 22, alignSelf: 'stretch', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: C.sub }}>DAILY GOAL</Text>
              <Text style={{ fontSize: 48, fontWeight: '800', color: C.blue }}>{goal.toLocaleString()} ml</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.sub }}>{reminderCountFor(goal)} reminders, {hourLabel(p.wakeHour)} to {hourLabel(p.sleepHour)}</Text>
            </View>
            <Text style={{ fontSize: 15, color: C.sub, textAlign: 'center', fontWeight: '600' }}>Pondly can nudge you through the day. You choose; no account needed.</Text>
            <Button label="Turn on reminders" onPress={() => finish(true)} style={{ alignSelf: 'stretch' }} />
            <Button label="Not now" kind="ghost" onPress={() => finish(false)} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
