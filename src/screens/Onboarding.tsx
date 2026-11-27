import React, { useState } from 'react';
import { Alert, ScrollView, View, Pressable } from 'react-native';
import { Text } from '../ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pip } from '../ui/Pip';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { PIPS, Activity, baseGoalMl, reminderCountFor } from '../logic/hydration';
import { useStore } from '../store';
import { enableReminders } from '../reminders';
import { setPushConsent } from '../push';

/** Number of onboarding screens (read by the autopilot panel). */
export const ONBOARDING_SCREENS = 10;

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

function Dots({ step }: { step: number }) {
  return (
    <View accessibilityLabel={`Step ${step + 1} of ${ONBOARDING_SCREENS}`} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 8 }}>
      {Array.from({ length: ONBOARDING_SCREENS }, (_, i) => (
        <View key={i} style={{ width: i === step ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: i <= step ? C.blue : C.card }} />
      ))}
    </View>
  );
}

function Slide({ pip, title, body, points, onNext, cta = 'Continue' }: { pip: number; title: string; body: string; points?: string[]; onNext: () => void; cta?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 24 }}>
      <Pip def={PIPS[pip % PIPS.length]} size={150} cheer />
      <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 17, color: C.sub, textAlign: 'center', fontWeight: '600' }}>{body}</Text>
      {points && (
        <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 18, alignSelf: 'stretch', gap: 10 }}>
          {points.map((t) => (
            <Text key={t} style={{ fontSize: 16, color: C.ink, fontWeight: '700' }}>{'\u2022  '}{t}</Text>
          ))}
        </View>
      )}
      <Button label={cta} onPress={onNext} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

export function Onboarding() {
  const { state, update } = useStore();
  const [step, setStep] = useState(0);
  const [sipped, setSipped] = useState(false);
  const p = state.profile;
  const goal = baseGoalMl(p);

  const [remindersOn, setRemindersOn] = useState(false);
  const next = () => setStep((n) => Math.min(n + 1, ONBOARDING_SCREENS - 1));

  const chooseReminders = async (withReminders: boolean) => {
    let on = false;
    if (withReminders) {
      on = await enableReminders(p.wakeHour, p.sleepHour, goal);
      if (!on) Alert.alert('Reminders are off', 'You can turn them on any time in Settings.');
    }
    setRemindersOn(on);
    next();
  };

  // OneSignal starts in consent-required mode; it only sends or collects anything after a yes here or in Settings.
  const finish = (tips: boolean) => {
    setPushConsent(tips);
    update({ onboarded: true, remindersOn });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.sky }}>
      <Dots step={step} />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18, flexGrow: 1 }}>
        {step === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingTop: 40 }}>
            <Pip def={PIPS[0]} size={190} cheer={sipped} />
            <Text style={{ fontSize: 34, fontWeight: '800', color: C.ink, textAlign: 'center' }}>Meet Pip</Text>
            <Text style={{ fontSize: 18, color: C.sub, textAlign: 'center', fontWeight: '600' }}>Every sip fills Pip&apos;s pond. Try one.</Text>
            {!sipped ? (
              <Button label="Sip 250 ml" onPress={() => { setSipped(true); }} style={{ alignSelf: 'stretch' }} />
            ) : (
              <>
                <Text style={{ fontSize: 20, fontWeight: '800', color: C.blue }}>Nice. Pip says thanks.</Text>
                <Button label="Continue" onPress={next} style={{ alignSelf: 'stretch' }} />
              </>
            )}
          </View>
        )}
        {step === 1 && (
          <Slide pip={1} title="Small sips, big difference" body="Even mild dehydration can leave you tired, foggy and headachy." points={['More steady energy through the afternoon', 'Clearer focus at work or study', 'A simple habit that sticks']} onNext={next} />
        )}
        {step === 2 && (
          <Slide pip={2} title="Fill the pond" body="Log a glass with one tap. Pip's pond fills as you drink and your streak grows day by day." points={['Quick-add 150, 250, 350 or 500 ml', 'Undo a mistake in one tap', 'Streaks and best streak saved']} onNext={next} />
        )}
        {step === 3 && (
          <Slide pip={3} title="A goal that fits the day" body="Thirst Forecast checks today's weather and your workout, then suggests how much more to drink." points={['Hotter day, slightly higher goal', 'Workout minutes add water', 'Uses approximate location only, once a day']} onNext={next} />
        )}
        {step === 4 && (
          <Slide pip={4} title="Hydrate together" body="Start a Circle with friends or family and cheer each other on. Share only a display name, no account needed." onNext={next} />
        )}
        {step === 5 && (
          <Slide pip={5} title="Collect new Pips" body="Hit your goal and keep your streak to unlock new pond friends." onNext={next} cta="Set my goal" />
        )}
        {step === 6 && (
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
            <Button label="Continue" onPress={next} />
          </>
        )}
        {step === 7 && (
          <>
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Your day</Text>
            <Text style={{ fontSize: 16, color: C.sub, fontWeight: '600' }}>Reminders only arrive while you are awake.</Text>
            <Stepper label="I wake at" value={p.wakeHour} unit="h" min={4} max={12} onChange={(n) => update({ profile: { ...p, wakeHour: n } })} />
            <Stepper label="I sleep at" value={p.sleepHour} unit="h" min={20} max={26} onChange={(n) => update({ profile: { ...p, sleepHour: n % 24 } })} />
            <Button label="Continue" onPress={next} />
          </>
        )}
        {step === 8 && (
          <View style={{ flex: 1, alignItems: 'center', gap: 16, paddingTop: 24 }}>
            <Pip def={PIPS[0]} size={140} cheer />
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Your plan is ready</Text>
            <View style={{ backgroundColor: C.card, borderRadius: 28, padding: 22, alignSelf: 'stretch', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: C.sub }}>DAILY GOAL</Text>
              <Text style={{ fontSize: 48, fontWeight: '800', color: C.blue }}>{goal.toLocaleString()} ml</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.sub }}>{reminderCountFor(goal)} reminders, {hourLabel(p.wakeHour)} to {hourLabel(p.sleepHour)}</Text>
            </View>
            <Text style={{ fontSize: 15, color: C.sub, textAlign: 'center', fontWeight: '600' }}>Pondly can nudge you through the day. You choose; no account needed.</Text>
            <Button label="Turn on reminders" onPress={() => chooseReminders(true)} style={{ alignSelf: 'stretch' }} />
            <Button label="Not now" kind="ghost" onPress={() => chooseReminders(false)} />
          </View>
        )}
        {step === 9 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 24 }}>
            <Pip def={PIPS[0]} size={140} cheer />
            <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink, textAlign: 'center' }}>Tips and news?</Text>
            <Text style={{ fontSize: 16, color: C.sub, textAlign: 'center', fontWeight: '600' }}>Now and then we send a hydration tip or tell you about new Pips. Sent with OneSignal. Nothing is sent or collected unless you say yes, and you can change it in Settings.</Text>
            <Button label="Yes, send me tips" onPress={() => finish(true)} style={{ alignSelf: 'stretch' }} />
            <Button label="No thanks" kind="ghost" onPress={() => finish(false)} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
