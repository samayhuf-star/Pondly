import React from 'react';
import Svg, { Ellipse, Circle, Path, G } from 'react-native-svg';
import { PipDef } from '../logic/hydration';

export function Pip({ def, size = 120, cheer = false }: { def: PipDef; size?: number; cheer?: boolean }) {
  const gills = cheer
    ? [[40, 70, -48], [30, 94, -24], [40, 118, 2], [160, 70, 48], [170, 94, 24], [160, 118, -2]]
    : [[40, 70, -28], [30, 94, -4], [40, 118, 22], [160, 70, 28], [170, 94, 4], [160, 118, -22]];
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityLabel={`${def.name} the axolotl`}>
      <G fill={def.gill}>
        {gills.map(([cx, cy, r], i) => (
          <Ellipse key={i} cx={cx} cy={cy} rx={28} ry={8} rotation={r} origin={`${cx}, ${cy}`} />
        ))}
      </G>
      <Ellipse cx={62} cy={168} rx={16} ry={9} fill={def.body} />
      <Ellipse cx={138} cy={168} rx={16} ry={9} fill={def.body} />
      <Ellipse cx={100} cy={116} rx={64} ry={56} fill={def.body} />
      <Ellipse cx={100} cy={140} rx={40} ry={26} fill={def.belly} />
      {cheer ? (
        <>
          <Path d="M68 104 Q76 96 84 104" fill="none" stroke="#0B2A3C" strokeWidth={4.5} strokeLinecap="round" />
          <Path d="M116 104 Q124 96 132 104" fill="none" stroke="#0B2A3C" strokeWidth={4.5} strokeLinecap="round" />
          <Path d="M86 120 Q100 140 114 120 Z" fill="#0B2A3C" />
        </>
      ) : (
        <>
          <Circle cx={76} cy={104} r={7.5} fill="#0B2A3C" />
          <Circle cx={124} cy={104} r={7.5} fill="#0B2A3C" />
          <Path d="M89 124 Q100 135 111 124" fill="none" stroke="#0B2A3C" strokeWidth={4} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
