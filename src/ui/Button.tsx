import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { Text } from './Text';
import * as Haptics from 'expo-haptics';
import { C } from './theme';

export function Button({ label, onPress, kind = 'primary', style, disabled }: { label: string; onPress: () => void; kind?: 'primary' | 'soft' | 'ghost'; style?: ViewStyle; disabled?: boolean }) {
  const bg = kind === 'primary' ? C.blue : kind === 'soft' ? C.blueSoft : 'transparent';
  const fg = kind === 'primary' ? '#fff' : C.blue;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
      style={({ pressed }) => [{ minHeight: 52, borderRadius: 26, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      <Text style={{ color: fg, fontWeight: '800', fontSize: 18 }}>{label}</Text>
    </Pressable>
  );
}
