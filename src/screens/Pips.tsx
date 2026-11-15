import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pip } from '../ui/Pip';
import { C } from '../ui/theme';
import { PIPS } from '../logic/hydration';
import { useStore } from '../store';

export function Pips() {
  const { state, unlocked, update } = useStore();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>Your Pips</Text>
        <Text style={{ color: C.sub, fontWeight: '700' }}>{unlocked.length} of {PIPS.length} collected</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {PIPS.map((p) => {
            const open = unlocked.includes(p.id);
            const active = state.activePip === p.id;
            return (
              <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={open ? `Choose ${p.name}` : `${p.name}, locked: ${p.unlock}`} disabled={!open} onPress={() => update({ activePip: p.id })}
                style={{ width: '47%', backgroundColor: C.card, borderRadius: 24, padding: 14, alignItems: 'center', gap: 4, borderWidth: 3, borderColor: active ? C.blue : 'transparent', opacity: open ? 1 : 0.55 }}>
                <Pip def={open ? p : { ...p, body: '#C9D6DF', belly: '#E4ECF2', gill: '#AAB9C4' }} size={100} />
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
