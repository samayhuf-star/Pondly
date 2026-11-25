import React, { useState } from 'react';
import { Alert, ScrollView, TextInput, View, Pressable } from 'react-native';
import { Text } from '../ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Capy } from '../ui/Capy';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { SKINS, Activity, baseGoalMl, reminderCountFor } from '../logic/hydration';
import { useStore } from '../store';
import { enableReminders } from '../reminders';
import { showPaywall } from '../purchases';

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

const TOTAL = 11;

interface Question {
  key: string;
  title: string;
  sub: string;
  options: string[];
}

const QUESTIONS: Record<string, Question> = {
  intake: { key: 'intake', title: 'How much water do you drink now?', sub: 'No wrong answer. Bruno just wants a starting line.', options: ['Barely any', 'A few glasses', 'About enough', 'A lot already'] },
  reason: { key: 'reason', title: 'Why do you want to drink more?', sub: 'Your bear will cheer for this.', options: ['More energy', 'Better skin', 'Fitness', 'Headaches and focus', 'Just healthier'] },
  forget: { key: 'forget', title: 'When do you forget most?', sub: 'Reminders will lean on this.', options: ['Mornings', 'At work or school', 'Afternoons', 'Evenings', 'All day'] },
  pond: { key: 'pond', title: 'Who shares your pond?', sub: 'A shared pond stays healthy when everyone drinks. You can invite people later in Circles.', options: ['My family', 'My friends', 'My partner', 'Just me for now'] },
};

export function Onboarding() {
  const { state, update } = useStore();
  const [step, setStep] = useState(0);
  const [sipped, setSipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const p = state.profile;
  const goal = baseGoalMl(p);
  const petName = state.petName.trim() || 'Bruno';
  const next = () => setStep((n) => Math.min(TOTAL - 1, n + 1));
  const answer = (key: string, value: string) => update({ answers: { ...state.answers, [key]: value } });

  const finish = async (withReminders: boolean) => {
    if (busy) return;
    setBusy(true);
    let on = false;
    if (withReminders) {
      on = await enableReminders(p.wakeHour, p.sleepHour, goal);
      if (!on) Alert.alert('Reminders are off', 'You can turn them on any time in Settings.');
    }
    // Paywall comes right after the questions. It stays optional while the plans are being set up.
    await showPaywall();
    update({ onboarded: true, remindersOn: on });
  };

  const dots = (
    <View accessible accessibilityLabel={`Step ${step + 1} of ${TOTAL}`} style={{ flexDirection: 'row', gap: 5, alignSelf: 'stretch' }}>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? C.blue : C.line }} />
      ))}
    </View>
  );

  const q = step === 4 ? QUESTIONS.intake : step === 5 ? QUESTIONS.reason : step === 6 ? QUESTIONS.forget : step === 7 ? QUESTIONS.pond : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.sky }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {step > 0 && dots}
        {step === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingTop: 40 }}>
            <Capy def={SKINS[0]} size={230} cheer={sipped} live sipKey={sipped ? 1 : 0} />
            <Text style={{ fontSize: 34, fontWeight: '800', color: C.ink, textAlign: 'center' }}>Meet your bear</Text>
            <Text style={{ fontSize: 18, color: C.sub, textAlign: 'center', fontWeight: '600' }}>Drink water, grow your bear, level up and fill a pond together. Try a sip.</Text>
            {!sipped ? (
              <Button label="Sip 250 ml" onPress={() => setSipped(true)} style={{ alignSelf: 'stretch' }} />
            ) : (
              <>
                <Text style={{ fontSize: 20, fontWeight: '800', color: C.blue }}>Nice. Bruno says thanks.</Text>
                <Button label="Continue" onPress={next} style={{ alignSelf: 'stretch' }} />
              </>
            )}
          </View>
        )}
        {step === 1 && (
          <>
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>What should we call you?</Text>
            <Text style={{ fontSize: 16, color: C.sub, fontWeight: '600' }}>Your friends in the shared pond will see this.</Text>
            <TextInput
              accessibilityLabel="Your name"
              value={state.displayName}
              onChangeText={(t) => update({ displayName: t.slice(0, 20) })}
              placeholder="Your name"
              placeholderTextColor={C.sub}
              maxLength={20}
              style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, fontSize: 20, fontWeight: '700', color: C.ink }}
            />
            <Button label="Continue" onPress={next} disabled={!state.displayName.trim()} />
          </>
        )}
        {step === 2 && (
          <>
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>How active are you?</Text>
            <View style={{ gap: 10 }}>
              {ACTIVITIES.map((a) => (
                <Pressable key={a.id} accessibilityRole="button" accessibilityState={{ selected: p.activity === a.id }} onPress={() => update({ profile: { ...p, activity: a.id } })}
                  style={{ paddingHorizontal: 18, minHeight: 56, borderRadius: 24, justifyContent: 'center', backgroundColor: p.activity === a.id ? C.blue : C.card }}>
                  <Text style={{ fontWeight: '800', fontSize: 17, color: p.activity === a.id ? '#fff' : C.ink }}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
            <Button label="Continue" onPress={next} />
          </>
        )}
        {step === 3 && (
          <>
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Your weight</Text>
            <Text style={{ fontSize: 16, color: C.sub, fontWeight: '600' }}>This sets a daily goal that fits your body. It stays on your phone.</Text>
            <Stepper label="Weight" value={p.weightKg} unit="kg" min={30} max={200} onChange={(n) => update({ profile: { ...p, weightKg: n } })} />
            <Button label="Continue" onPress={next} />
          </>
        )}
        {q && (
          <>
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>{q.title}</Text>
            <Text style={{ fontSize: 16, color: C.sub, fontWeight: '600' }}>{q.sub}</Text>
            <View style={{ gap: 10 }}>
              {q.options.map((o) => {
                const on = state.answers[q.key] === o;
                return (
                  <Pressable key={o} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => answer(q.key, o)}
                    style={{ paddingHorizontal: 18, minHeight: 56, borderRadius: 24, justifyContent: 'center', backgroundColor: on ? C.blue : C.card }}>
                    <Text style={{ fontWeight: '800', fontSize: 17, color: on ? '#fff' : C.ink }}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button label="Continue" onPress={next} disabled={!state.answers[q.key]} />
          </>
        )}
        {step === 8 && (
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Capy def={SKINS[0]} size={170} live />
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink, textAlign: 'center' }}>Name your bear</Text>
            <TextInput
              accessibilityLabel="Bear name"
              value={state.petName}
              onChangeText={(t) => update({ petName: t.slice(0, 14) })}
              placeholder="Bruno"
              placeholderTextColor={C.sub}
              maxLength={14}
              style={{ alignSelf: 'stretch', backgroundColor: C.card, borderRadius: 20, padding: 16, fontSize: 20, fontWeight: '700', color: C.ink, textAlign: 'center' }}
            />
            <Button label="Continue" onPress={next} style={{ alignSelf: 'stretch' }} />
          </View>
        )}
        {step === 9 && (
          <>
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>When are you awake?</Text>
            <Text style={{ fontSize: 16, color: C.sub, fontWeight: '600' }}>Reminders only land inside these hours.</Text>
            <Stepper label="I wake at" value={p.wakeHour} unit="h" min={4} max={12} onChange={(n) => update({ profile: { ...p, wakeHour: n } })} />
            <Stepper label="I sleep at" value={p.sleepHour} unit="h" min={20} max={26} onChange={(n) => update({ profile: { ...p, sleepHour: n % 24 } })} />
            <Button label="Continue" onPress={next} />
          </>
        )}
        {step === 10 && (
          <View style={{ flex: 1, alignItems: 'center', gap: 14, paddingTop: 8 }}>
            <Capy def={SKINS[0]} size={150} cheer live />
            <Text style={{ fontSize: 28, fontWeight: '800', color: C.ink, textAlign: 'center' }}>{`${petName} is ready`}</Text>
            <View style={{ backgroundColor: C.card, borderRadius: 28, padding: 20, alignSelf: 'stretch', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: C.sub }}>DAILY GOAL</Text>
              <Text style={{ fontSize: 46, fontWeight: '800', color: C.blue }}>{goal.toLocaleString()} ml</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.sub }}>{reminderCountFor(goal)} reminders, {hourLabel(p.wakeHour)} to {hourLabel(p.sleepHour)}</Text>
            </View>
            <View style={{ alignSelf: 'stretch', gap: 6 }}>
              {['Level up with every sip', 'Hit your goal to open a daily chest', 'Keep a shared pond healthy together'].map((t) => (
                <Text key={t} style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{`• ${t}`}</Text>
              ))}
            </View>
            <Button label="Turn on reminders" onPress={() => finish(true)} disabled={busy} style={{ alignSelf: 'stretch' }} />
            <Button label="Not now" kind="ghost" onPress={() => finish(false)} disabled={busy} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
