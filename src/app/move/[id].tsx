import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ClipPlayer from '../../components/ClipPlayer';
import { useClip } from '../../components/PlayButton';
import { getMove } from '../../data';
import type { Move } from '../../data/types';
import { useStore } from '../../store';
import { c, heading } from '../../theme';

const advColor = (v: string) => {
  const n = parseInt((/[+-]?\d+/.exec(v) ?? [''])[0], 10);
  return Number.isNaN(n) ? c.text : n < 0 ? c.minus : n > 0 ? c.plus : c.text;
};

export default function MoveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const found = getMove(id);
  if (!found) return <Text style={s.empty}>Move not found</Text>;
  return <MoveDetail chName={found.ch.name} m={found.move} />;
}

function MoveDetail({ chName, m }: { chName: string; m: Move }) {
  const { url, from } = useClip(m);
  const { favorites, toggleFavorite } = useStore();
  const fav = favorites.includes(m.id);
  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: chName.toUpperCase() }} />
      <View style={s.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.notation}>{m.notation}</Text>
          {!!m.name && <Text style={s.name}>{m.name}</Text>}
        </View>
        <Pressable onPress={() => toggleFavorite(m.id)} hitSlop={10} accessibilityLabel={fav ? 'Remove favorite' : 'Add favorite'}>
          <Text style={[s.heart, fav && { color: c.minus }]}>{fav ? '♥' : '♡'}</Text>
        </Pressable>
      </View>

      {url ? <ClipPlayer key={url} url={url} from={from} /> : (
        <View style={s.noClip}><Text style={s.mute}>No clip for this move on wavu.wiki yet. You can add a clip URL under Edit on the character&apos;s frame data.</Text></View>
      )}

      <View style={s.grid}>
        <Stat label="Level" v={m.hitLevel} />
        <Stat label="Startup" v={m.startup} />
        <Stat label="Block" v={m.onBlock} color={advColor(m.onBlock)} />
        <Stat label="Hit" v={m.onHit} color={advColor(m.onHit)} />
        <Stat label="Counter hit" v={m.onCounterHit} color={advColor(m.onCounterHit)} />
        <Stat label="Damage" v={m.damage} />
      </View>
      {m.tags.length > 0 && (
        <View style={s.tags}>
          {m.tags.map((t) => <View key={t} style={s.badge}><Text style={s.badgeText}>{t}</Text></View>)}
        </View>
      )}
      {!!m.notes && <Text style={s.notes}>{m.notes}</Text>}
      {!!url && !!m.clipUrl && url === m.clipUrl && <Text style={s.credit}>Clip: wavu.wiki</Text>}
    </ScrollView>
  );
}

const Stat = ({ label, v, color }: { label: string; v: string; color?: string }) => (
  <View style={s.stat}>
    <Text style={s.statLabel}>{label}</Text>
    <Text style={[s.statVal, color ? { color } : null]}>{v.trim() || '—'}</Text>
  </View>
);

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 14 },
  empty: { color: c.mute, textAlign: 'center', marginTop: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  notation: { ...heading, color: c.amber, fontSize: 28 },
  name: { color: c.text, fontSize: 15, marginTop: 2 },
  heart: { color: c.mute, fontSize: 28 },
  noClip: { aspectRatio: 16 / 9, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', padding: 20 },
  mute: { color: c.mute, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '31.5%', backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 10 },
  statLabel: { color: c.mute, fontSize: 11, fontWeight: '700' },
  statVal: { color: c.text, fontSize: 16, fontWeight: '800', marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { backgroundColor: c.amberDim, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: c.amber, fontSize: 12, fontWeight: '700' },
  notes: { color: '#cfcfcf', fontSize: 14, lineHeight: 20 },
  credit: { color: c.mute, fontSize: 11 },
});
