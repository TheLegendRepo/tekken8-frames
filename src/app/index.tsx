import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { characters, dataset } from '../data';
import { useStore } from '../store';
import { c, heading } from '../theme';

export default function Home() {
  const [q, setQ] = useState('');
  const { favorites } = useStore();
  const list = useMemo(
    () => characters.filter((x) => x.name.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );
  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 16 }}>
      {dataset.meta.isSample && (
        <View style={s.banner}>
          <Text style={s.bannerText}>
            SAMPLE DATA: placeholder values, not verified. Replace src/data/framedata.json with real data.
          </Text>
        </View>
      )}
      <Text style={s.h1}>Tekken 8 frame data</Text>
      <Text style={s.p}>
        Frames are 1/60 of a second. <Text style={s.b}>Startup</Text> is how long a move takes to hit.{' '}
        <Text style={s.b}>Block</Text> is who has the advantage after it is blocked: at -10 or worse,
        a 10-frame move punishes it. Pick a character to browse moves, save favorites and quiz yourself.
      </Text>
      <TextInput
        style={s.input} placeholder="Search characters" placeholderTextColor={c.mute}
        value={q} onChangeText={setQ} autoCorrect={false}
      />
      <Text style={s.h2}>Characters</Text>
      <View style={s.grid}>
        {list.map((ch) => (
          <Link key={ch.id} href={{ pathname: '/character/[id]', params: { id: ch.id } }} asChild>
            <Pressable style={s.tile}>
              <View style={s.avatar}><Text style={s.initial}>{ch.name[0]}</Text></View>
              <Text style={s.name} numberOfLines={1}>{ch.name}</Text>
              <Text style={s.count}>
                {ch.moves.length} moves · {ch.moves.filter((m) => favorites.includes(m.id)).length} ♥
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
      {list.length === 0 && <Text style={s.empty}>No characters found</Text>}
      {!dataset.meta.isSample && !!dataset.meta.attribution && <Text style={s.attr}>{dataset.meta.attribution}</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  banner: { backgroundColor: '#3d2800', padding: 10, borderRadius: 8, marginBottom: 14 },
  bannerText: { color: '#ffd28a', fontSize: 12 },
  h1: { ...heading, color: c.text, fontSize: 28, marginBottom: 8 },
  h2: { ...heading, color: c.text, fontSize: 22, marginTop: 8, marginBottom: 10 },
  p: { color: '#cfcfcf', fontSize: 15, lineHeight: 22, marginBottom: 14 },
  b: { color: c.text, fontWeight: '800' },
  input: { padding: 12, borderRadius: 10, backgroundColor: c.input, borderWidth: 1, borderColor: c.border, color: c.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31%', flexGrow: 1, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 10, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 12, backgroundColor: c.amberDim, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  initial: { ...heading, color: c.amber, fontSize: 32 },
  name: { color: c.text, fontWeight: '700', fontSize: 13 },
  count: { color: c.mute, fontSize: 11, marginTop: 2 },
  attr: { color: c.mute, fontSize: 11, marginTop: 20, lineHeight: 16 },
  empty: { color: c.mute, textAlign: 'center', marginTop: 30 },
});
