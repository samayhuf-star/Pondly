import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Text } from '../ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { forecastGoal, reminderHours, reminderCountFor } from '../logic/hydration';
import { useStore } from '../store';
import { fetchTodayHigh } from '../weather';
import { scheduleReminders } from '../reminders';
import { showPaywall } from '../purchases';

export function Forecast({ pro, onPro }: { pro: boolean; onPro: () => void }) {
  const { state, baseGoal, goalToday, setTodayGoal } = useStore();
  const [tempC, setTempC] = useState<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied' | 'error'>('loading');
  const [workout, setWorkout] = useState(0);

  const load = useCallback(async () => {
    setStatus('loading');
    const r = await fetchTodayHigh();
    if (r.status === 'ok') { setTempC(r.tempC); setStatus('ok'); } else setStatus(r.status);
  }, []);
  useEffect(() => { load(); }, [load]);

  const f = forecastGoal({ baseMl: baseGoal, tempC, workoutMin: workout });
  const hours = reminderHours(state.profile.wakeHour, state.profile.sleepHour, reminderCountFor(f.goalMl));

  const apply = async () => {
    if (!pro) {
      const r = await showPaywall();
      if (r === 'purchased') onPro();
      else if (r === 'unavailable') Alert.alert('Pondly Pro', 'Pro is not available in this build yet.');
      return;
    }
    setTodayGoal(f.goalMl);
    if (state.remindersOn) await scheduleReminders(state.profile.wakeHour, state.profile.sleepHour, f.goalMl);
    Alert.alert('Goal updated', `Today's goal is ${f.goalMl.toLocaleString()} ml.`);
  };

  const row = (label: string, v: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: C.sub, fontWeight: '700', fontSize: 16 }}>{label}</Text>
      <Text style={{ color: C.ink, fontWeight: '800', fontSize: 16 }}>{v}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Thirst Forecast</Text>
        <View style={{ backgroundColor: '#FFE8B8', borderRadius: 24, padding: 20, gap: 6 }}>
          {status === 'loading' && <Text style={{ fontWeight: '800', color: C.ink, fontSize: 18 }}>Checking today's weather…</Text>}
          {status === 'ok' && (
            <>
              <Text style={{ fontWeight: '800', color: '#4A3B14' }}>TODAY'S HIGH</Text>
              <Text style={{ fontSize: 44, fontWeight: '800', color: C.ink }}>{tempC}°C</Text>
            </>
          )}
          {(status === 'denied' || status === 'error') && (
            <>
              <Text style={{ fontWeight: '800', color: C.ink, fontSize: 18 }}>{status === 'denied' ? 'Location is off' : "Couldn't get the weather"}</Text>
              <Text style={{ color: '#4A3B14', fontWeight: '600' }}>{status === 'denied' ? 'Allow location while using the app to adapt your goal to the weather. You can also set a temperature below.' : 'Check your connection, or set a temperature below.'}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <Button label="Try again" kind="soft" onPress={load} />
                {[25, 30, 35, 40].map((t) => (
                  <Button key={t} label={`${t}°C`} kind={tempC === t ? 'primary' : 'soft'} onPress={() => setTempC(t)} style={{ minWidth: 70 }} />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 20 }}>
          {row('Your base goal', `${baseGoal.toLocaleString()} ml`)}
          {row('Heat', `+${f.heatMl} ml`)}
          {row('Workout', `+${f.workoutMl} ml`)}
          <View style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }} />
          {row("Today's goal", `${f.goalMl.toLocaleString()} ml`)}
          <Text style={{ color: C.sub, fontWeight: '700', marginTop: 12 }}>Workout minutes today</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {[0, 20, 40, 60].map((m) => (
              <Button key={m} label={m === 0 ? 'None' : `${m} min`} kind={workout === m ? 'primary' : 'soft'} onPress={() => setWorkout(m)} style={{ minWidth: 76 }} />
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 20, gap: 10 }}>
          <Text style={{ fontWeight: '800', color: C.ink, fontSize: 18 }}>When to sip</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 }}>
            {hours.map((h, i) => (
              <View key={`${h}-${i}`} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View style={{ width: '100%', height: 30 + ((i * 17) % 50), borderRadius: 8, backgroundColor: C.water }} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: C.sub }}>{h}h</Text>
              </View>
            ))}
          </View>
        </View>

        <Button label={pro ? `Use ${f.goalMl.toLocaleString()} ml today` : 'Unlock with Pondly Pro'} onPress={apply} disabled={goalToday === f.goalMl && pro} />
        {!pro && <Text style={{ textAlign: 'center', color: C.sub, fontWeight: '600' }}>The forecast is free to preview. Applying it to your goal is a Pro feature.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
