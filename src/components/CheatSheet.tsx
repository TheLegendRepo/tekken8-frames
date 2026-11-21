import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { cell, isLauncher, numOf } from '../data';
import type { Character, Move } from '../data/types';
import { c, heading } from '../theme';

// Sections are computed from the data, so they stay correct when real data is swapped in.
export default function CheatSheet({ ch }: { ch: Character }) {
  const by = (f: (m: Move) => boolean, sort?: (a: Move, b: Move) => number) => {
    const r = ch.moves.filter(f);
    return sort ? r.sort(sort) : r;
  };
  const st = (m: Move) => numOf(m.startup) ?? 999;
  const sections: { title: string; moves: Move[] }[] = [
    { title: 'Fastest moves', moves: by((m) => numOf(m.startup) !== null, (a, b) => st(a) - st(b)).slice(0, 5) },
    { title: 'Launchers', moves: by((m) => isLauncher(m), (a, b) => st(a) - st(b)) },
    { title: 'Plus on block', moves: by((m) => (numOf(m.onBlock) ?? -1) > 0) },
    { title: 'Punishers (i10-i15)', moves: by((m) => st(m) >= 10 && st(m) <= 15, (a, b) => st(a) - st(b)).slice(0, 8) },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 14, gap: 16 }}>
      {sections.map((sec) => (
        <View key={sec.title}>
          <Text style={s.h}>{sec.title}</Text>
          {sec.moves.length === 0 && <Text style={s.mute}>None</Text>}
          {sec.moves.map((m) => (
            <View key={m.id} style={s.row}>
              <Text style={s.n}>{m.notation}</Text>
              <Text style={s.v}>{cell(m.startup)}</Text>
              <Text style={s.v}>{cell(m.onBlock)}</Text>
              <Text style={s.v}>{cell(m.onHit)}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  h: { ...heading, color: c.text, fontSize: 18, marginBottom: 6 },
  mute: { color: c.mute },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: c.border },
  n: { flex: 2, color: c.amber, fontWeight: '800' },
  v: { flex: 1, color: c.text, textAlign: 'center' },
});
