import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Capy } from '../ui/Capy';
import { C } from '../ui/theme';
import { SKINS } from '../logic/hydration';
import { GEAR } from '../logic/gear';
import { useStore } from '../store';

export function Pips() {
  const { state, unlocked, update } = useStore();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Your Capybaras</Text>
        <Text style={{ color: C.sub, fontWeight: '700' }}>{unlocked.length} of {SKINS.length} collected</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.ink }}>Gear from your daily chest</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {GEAR.map((g) => {
            const owned = state.ownedGear.includes(g.id);
            const worn = state.equippedGear.includes(g.id);
            return (
              <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={owned ? `${worn ? 'Take off' : 'Wear'} ${g.name}` : `${g.name}, not found yet`} disabled={!owned}
                onPress={() => update({ equippedGear: worn ? state.equippedGear.filter((x) => x !== g.id) : [...state.equippedGear, g.id] })}
                style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 22, backgroundColor: C.card, borderWidth: 3, borderColor: worn ? C.blue : 'transparent', opacity: owned ? 1 : 0.5 }}>
                <Text style={{ fontWeight: '800', color: C.ink }}>{owned ? (worn ? `${g.name} (on)` : g.name) : `${g.name} (locked)`}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.ink }}>Skins</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {SKINS.map((p) => {
            const open = unlocked.includes(p.id);
            const active = state.activePip === p.id;
            return (
              <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={open ? `Choose ${p.name}` : `${p.name}, locked: ${p.unlock}`} disabled={!open} onPress={() => update({ activePip: p.id })}
                style={{ width: '47%', backgroundColor: C.card, borderRadius: 24, padding: 14, alignItems: 'center', gap: 4, borderWidth: 3, borderColor: active ? C.blue : 'transparent', opacity: open ? 1 : 0.55 }}>
                <Capy gear={active ? state.equippedGear : []} def={open ? p : { ...p, body: '#C9D6DF', belly: '#E4ECF2', gill: '#AAB9C4' }} size={100} />
                <Text style={{ fontWeight: '800', color: C.ink, fontSize: 16 }}>{p.name}</Text>
                <Text style={{ fontWeight: '700', color: C.sub, fontSize: 13, textAlign: 'center' }}>{open ? (active ? 'In your pond' : 'Tap to use') : `Unlock: ${p.unlock}`}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
