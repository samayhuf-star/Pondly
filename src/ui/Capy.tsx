import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import Svg, { Ellipse, Circle, Path, G } from 'react-native-svg';
import { PipDef } from '../logic/hydration';
import { Mood, stageFor } from '../logic/vitality';
import { buildCapy } from './capyShapes';

interface Props {
  def: PipDef;
  size?: number;
  /** Forces the happy goal-reached pose (kept for older call sites). */
  cheer?: boolean;
  /** 0..100. How grown and healthy the capybara is. Default shows a healthy capybara. */
  vitality?: number;
  mood?: Mood;
  /** Turn on breathing, blinking, ear wiggle and sip reactions. Off by default so lists stay cheap. */
  live?: boolean;
  /** Change this value (e.g. number of sips today) to make the capybara react to a sip. */
  sipKey?: number;
  /** Worn gear ids. */
  gear?: string[];
}

const VIEW = '-24 -24 248 248';

export function Capy({ def, size = 120, cheer = false, vitality = 60, mood = 'happy', live = false, sipKey = 0, gear }: Props) {
  const [blink, setBlink] = useState(false);
  const [sway, setSway] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const animate = live && !reduceMotion;
  const effective: Mood = cheer ? 'thrilled' : mood;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // Blink every few seconds (not while asleep) and flap the flippers.
  useEffect(() => {
    if (!animate) return;
    let off: ReturnType<typeof setTimeout> | undefined;
    const blinkTimer = setInterval(() => {
      if (effective === 'sleeping') return;
      setBlink(true);
      off = setTimeout(() => setBlink(false), 150);
    }, 3300);
    let phase = 1;
    const swayTimer = setInterval(() => {
      phase = -phase;
      setSway(effective === 'sleeping' ? 0 : phase);
    }, effective === 'thrilled' ? 450 : 800);
    return () => { clearInterval(blinkTimer); clearInterval(swayTimer); if (off) clearTimeout(off); };
  }, [animate, effective]);

  // Breathing and floating. Slow and shallow when weak or asleep, lively when strong.
  const [breathe] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!animate) { breathe.setValue(0); return; }
    const period = effective === 'sleeping' ? 3600 : vitality < 30 ? 3000 : effective === 'thrilled' ? 1300 : 2000;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, effective, vitality, breathe]);

  // Sip reaction: a hop, a squash on landing, and rising bubbles.
  const [hop] = useState(() => new Animated.Value(0));
  const [bubbles] = useState(() => new Animated.Value(0));
  const firstKey = useRef(sipKey);
  useEffect(() => {
    if (!animate || sipKey === firstKey.current) { firstKey.current = sipKey; return; }
    firstKey.current = sipKey;
    hop.setValue(0);
    bubbles.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(hop, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(hop, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true }),
      ]),
      Animated.timing(bubbles, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [sipKey, animate, hop, bubbles]);

  const amp = effective === 'sleeping' ? 1 : vitality < 30 ? 1.5 : 3;
  const translateY = Animated.add(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [amp, -amp] }),
    hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.1] }),
  );
  const scaleY = Animated.multiply(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }),
    hop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }),
  );

  const { shapes, scale } = useMemo(() => buildCapy(def, { vitality, mood, cheer, blink: animate && blink, sway: animate ? sway : 0, gear }), [def, vitality, mood, cheer, animate, blink, sway, gear]);
  const tx = 100 - 100 * scale;
  const ty = 180 - 180 * scale;
  const stage = stageFor(vitality);

  const bubbleSpecs = [
    { x: 0.3, delay: 0, s: 0.07 },
    { x: 0.5, delay: 0.15, s: 0.05 },
    { x: 0.68, delay: 0.3, s: 0.06 },
  ];

  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={`${def.name} the capybara, ${stage.label.toLowerCase()}, ${effective}`}>
      <Animated.View style={{ width: size, height: size, transform: [{ translateY }, { scaleY }] }}>
        <Svg width={size} height={size} viewBox={VIEW}>
          <G transform={`translate(${tx} ${ty}) scale(${scale})`}>
            {shapes.map((s, i) => {
              if (s.t === 'ellipse') return <Ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={s.fill} rotation={s.rotation} origin={`${s.cx}, ${s.cy}`} />;
              if (s.t === 'circle') return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} />;
              return <Path key={i} d={s.d} fill={s.fill ?? 'none'} stroke={s.stroke} strokeWidth={s.sw} strokeLinecap="round" strokeLinejoin="round" />;
            })}
          </G>
        </Svg>
      </Animated.View>
      {animate && bubbleSpecs.map((b, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: size * b.x,
            top: size * 0.35,
            width: size * b.s,
            height: size * b.s,
            borderRadius: size,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            backgroundColor: 'rgba(125,211,252,0.45)',
            opacity: bubbles.interpolate({ inputRange: [0, b.delay, b.delay + 0.2, 1], outputRange: [0, 0, 1, 0], extrapolate: 'clamp' }),
            transform: [{ translateY: bubbles.interpolate({ inputRange: [0, 1], outputRange: [0, -size * (0.35 + i * 0.05)] }) }],
          }}
        />
      ))}
    </View>
  );
}
