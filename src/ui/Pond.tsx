import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { C } from './theme';

/** Circular pond whose water level rises with progress (0..1). */
export function Pond({ progress, size, children }: { progress: number; size: number; children?: React.ReactNode }) {
  const level = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(level, { toValue: Math.min(1, Math.max(0, progress)), duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress, level]);
  const height = level.interpolate({ inputRange: [0, 1], outputRange: [0, size] });
  return (
    <View
      accessible
      accessibilityLabel={`Water goal ${Math.round(progress * 100)} percent`}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.blueSoft, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center' }}
    >
      <Animated.View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height, backgroundColor: C.water, opacity: 0.85 }} />
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}
