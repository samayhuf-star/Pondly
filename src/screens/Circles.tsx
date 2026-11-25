import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Share, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../ui/Text';
import { Capy } from '../ui/Capy';
import { Pond } from '../ui/Pond';
import { Button } from '../ui/Button';
import { C } from '../ui/theme';
import { SKINS, totalMl } from '../logic/hydration';
import { useStore } from '../store';
import { CircleView, blockMember, createCircle, joinCircle, leaveCircle, newToken, nudgeMember, reportMember, syncCircle } from '../circles';

const input = { backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 16, minHeight: 52, fontSize: 17, color: C.ink, fontFamily: 'Nunito_700Bold' } as const;

/** Circles: private groups that share goal progress only, never what you drink. */
export function Circles() {
  const { state, todayKey, goalToday, vitality, update } = useStore();
  const ml = totalMl(state.log[todayKey] ?? []);
  const pct = Math.min(100, Math.round((ml / goalToday) * 100));
  const pip = SKINS.find((p) => p.id === state.activePip) ?? SKINS[0];
  const [view, setView] = useState<CircleView | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(state.displayName);
  const [circleName, setCircleName] = useState('');
  const [code, setCode] = useState('');
  const [offline, setOffline] = useState(false);
  const [token] = useState(() => state.circleToken || newToken());

  const refresh = useCallback(() => {
    if (!state.circleCode) return;
    syncCircle(state.circleCode, state.circleToken, pct)
      .then((v) => { setView(v); setOffline(false); })
      .catch((e: Error) => {
        if (e.message === 'Not a member') update({ circleCode: '' });
        else setOffline(true);
      });
  }, [state.circleCode, state.circleToken, pct, update]);

  useEffect(() => { refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, [refresh]);

  const run = async (fn: () => Promise<CircleView>) => {
    if (!name.trim()) { Alert.alert('Add your name', 'Friends will see this name in your Circle.'); return; }
    setBusy(true);
    try {
      const v = await fn();
      update({ circleCode: v.code, circleToken: token, displayName: name.trim() });
      setView(v);
    } catch (e) { Alert.alert('Could not continue', (e as Error).message); }
    setBusy(false);
  };

  const moderate = (id: string, who: string) =>
    Alert.alert(who, 'Report or block this person. Blocking hides you from each other in this Circle.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', onPress: async () => { try { setView(await blockMember(state.circleCode, state.circleToken, id)); } catch (e) { Alert.alert('Could not block', (e as Error).message); } } },
      { text: 'Report and block', style: 'destructive', onPress: async () => { try { setView(await reportMember(state.circleCode, state.circleToken, id, 'inappropriate')); Alert.alert('Thanks', 'We review reports within 24 hours. This person is now blocked.'); } catch (e) { Alert.alert('Could not report', (e as Error).message); } } },
    ]);

  const invite = (c: string) => Share.share({ message: `Join my Pondly Circle with code ${c}. We share goal progress only, never what we drink. Open Pondly, tap Circles, then Join.` });

  if (!state.circleCode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Circles</Text>
          <View style={{ backgroundColor: C.blueSoft, borderRadius: 28, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pond progress={ml / goalToday} size={96}><Capy def={pip} size={60} vitality={vitality.value} gear={state.equippedGear} /></Pond>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: C.ink }}>Fill one pond together</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.sub }}>Friends see your goal progress only, never what you drink.</Text>
            </View>
          </View>
          <TextInput accessibilityLabel="Your name" placeholder="Your name" placeholderTextColor={C.sub} maxLength={24} value={name} onChangeText={setName} style={input} />
          <TextInput accessibilityLabel="Circle name" placeholder="Name your Circle, e.g. Office Pond" placeholderTextColor={C.sub} maxLength={24} value={circleName} onChangeText={setCircleName} style={input} />
          <Button label="Start a Circle" disabled={busy || !circleName.trim()} onPress={() => run(() => createCircle(circleName.trim(), name.trim(), token))} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 8 }}>Have a code?</Text>
          <TextInput accessibilityLabel="Circle code" placeholder="6-letter code" placeholderTextColor={C.sub} autoCapitalize="characters" maxLength={6} value={code} onChangeText={(t) => setCode(t.toUpperCase())} style={input} />
          <Button label="Join" kind="soft" disabled={busy || code.length !== 6} onPress={() => run(() => joinCircle(code, name.trim(), token))} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const members = view?.members ?? [];
  const done = members.filter((m) => m.pct >= 100).length;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>{view?.name ?? 'Circle'}</Text>
          <Button label="Invite" kind="soft" onPress={() => invite(state.circleCode)} style={{ minHeight: 44 }} />
        </View>
        <View style={{ backgroundColor: C.blueSoft, borderRadius: 28, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pond progress={members.length ? done / members.length : 0} size={96}><Capy def={pip} size={60} vitality={vitality.value} gear={state.equippedGear} /></Pond>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink }}>{done} of {members.length || 1} hit goal</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.sub }}>Code {state.circleCode}</Text>
          </View>
        </View>
        {view && view.nudgedBy.length > 0 && <Text style={{ fontSize: 16, fontWeight: '800', color: C.blue }}>{view.nudgedBy.join(', ')} sent you a nudge. Time for a sip.</Text>}
        <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 16, gap: 14 }}>
          {members.map((m) => (
            <View key={m.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
                                  <Text accessibilityHint={m.id === view?.me ? undefined : 'Long press to report or block'} onLongPress={m.id === view?.me ? undefined : () => moderate(m.id, m.name)} style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>{m.id === view?.me ? 'You' : m.name}</Text>
                  {m.id !== view?.me && <Text accessibilityRole="button" accessibilityLabel={`Report or block ${m.name}`} onPress={() => moderate(m.id, m.name)} style={{ fontSize: 13, fontWeight: '800', color: C.sub, paddingVertical: 8 }}>Report</Text>}
                </View>
                {m.id !== view?.me && m.pct < 100 ? (
                  <Button label={m.nudgedByMe ? 'Nudged' : 'Nudge'} kind="soft" disabled={m.nudgedByMe} style={{ minHeight: 40, paddingHorizontal: 16 }}
                    onPress={async () => { try { setView(await nudgeMember(state.circleCode, state.circleToken, m.id)); } catch (e) { Alert.alert('Could not nudge', (e as Error).message); } }} />
                ) : <Text style={{ fontSize: 15, fontWeight: '800', color: m.pct >= 100 ? C.mint : C.sub }}>{m.pct >= 100 ? 'Goal hit' : `${m.pct}%`}</Text>}
              </View>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: C.blueSoft, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, m.pct)}%`, height: 10, backgroundColor: m.pct >= 100 ? C.mint : C.blue }} />
              </View>
            </View>
          ))}
        </View>
        {offline && <Text style={{ fontSize: 14, fontWeight: '700', color: C.sub, textAlign: 'center' }}>You are offline. Progress updates when you reconnect.</Text>}
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.sub, textAlign: 'center' }}>Circles share goal progress only. One nudge per person per day. Press and hold a name to report or block.</Text>
        <Button label="Leave Circle" kind="ghost"
          onPress={() => Alert.alert('Leave this Circle?', 'You can rejoin with the code.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: async () => { await leaveCircle(state.circleCode, state.circleToken).catch(() => {}); update({ circleCode: '' }); setView(null); } }])} />
      </ScrollView>
    </SafeAreaView>
  );
}
