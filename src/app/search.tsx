import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { cell, characters } from '../data';
import { c } from '../theme';

// Global search across every character's moves.
export default function Search() {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return characters.flatMap((ch) =>
      ch.moves
        .filter((m) => m.notation.toLowerCase().includes(t) || ch.name.toLowerCase().includes(t) || m.tags.some((x) => x.includes(t)))
        .map((m) => ({ ch, m })),
    ).slice(0, 200);
  }, [q]);
  return (
    <View style={{ flex: 1 }}>
      <TextInput autoFocus style={s.input} placeholder="Search all moves or characters" placeholderTextColor={c.mute}
        value={q} onChangeText={setQ} autoCapitalize="none" autoCorrect={false} />
      <FlatList
        data={results}
        keyExtractor={(r) => r.m.id}
        ListEmptyComponent={<Text style={s.empty}>{q ? 'No results' : 'Type to search'}</Text>}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/character/[id]', params: { id: item.ch.id } }} asChild>
            <Pressable style={s.row}>
              <Text style={s.n}>{item.m.notation}</Text>
              <Text style={s.mute}>{item.ch.name}</Text>
              <Text style={s.v}>{cell(item.m.startup)} / {cell(item.m.onBlock)}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  input: { margin: 12, padding: 12, borderRadius: 10, backgroundColor: c.input, borderWidth: 1, borderColor: c.border, color: c.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderColor: c.border },
  n: { color: c.amber, fontWeight: '800', flex: 1 },
  mute: { color: c.mute },
  v: { color: c.text, width: 80, textAlign: 'right' },
  empty: { color: c.mute, textAlign: 'center', marginTop: 40 },
});
