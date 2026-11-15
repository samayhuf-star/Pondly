import React from 'react';
import { StyleSheet, Text as RNText, TextProps } from 'react-native';

/** Brand text: Fredoka for big headlines and numbers, Nunito for everything else. */
export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const w = String(flat.fontWeight ?? '400');
  const size = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  const heavy = w === '800' || w === '900' || w === 'bold';
  let family = 'Nunito_400Regular';
  if (heavy && size >= 22) family = 'Fredoka_700Bold';
  else if (heavy) family = 'Nunito_800ExtraBold';
  else if (w === '700') family = 'Nunito_700Bold';
  else if (w === '600') family = 'Nunito_600SemiBold';
  return <RNText {...rest} style={[style, { fontFamily: family, fontWeight: 'normal' }]} />;
}
