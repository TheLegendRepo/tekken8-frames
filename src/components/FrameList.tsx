import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Filter, SortKey, cell, numOf, queryMoves } from '../data';
import type { Character, Move } from '../data/types';
import { useStore } from '../store';
import { c } from '../theme';
import PlayButton from './PlayButton';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'favorites', label: '♥ Favorites' },
  { key: 'launcher', label: 'Launchers' },
  { key: 'i10-i15', label: 'Punishers i10-i15' },
  { key: 'safe', label: 'Safe (>= -9)' },
  { key: 'homing', label: 'Homing' },
  { key: 'powercrush', label: 'Power crush' },
];
const SORTS: { key: SortKey | null; label: string }[] = [
  { key: null, label: 'Default' }, { key: 'level', label: 'Level' }, { key: 'startup', label: 'Startup' },
  { key: 'onBlock', label: 'Block' }, { key: 'onHit', label: 'Hit' },
  { key: 'onCounterHit', label: 'Counter hit' }, { key: 'damage', label: 'Damage' },
];
const MODES = ['Default', 'Compact', 'Detailed'] as const;
type Mode = (typeof MODES)[number];

const advColor = (v: string) => {
  const n = numOf(v);
  if (/\d\s*a/.test(v)) return c.launch;
  return n === null ? c.mute : n > 0 ? c.plus : n <= -10 ? c.minus : c.text;
};

export default function FrameList({ ch, editing }: { ch: Character; editing?: boolean }) {
  const { favorites, toggleFavorite } = useStore();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sort, setSort] = useState<SortKey | null>(null);
  const [desc, setDesc] = useState(false);
  const [mode, setMode] = useState<Mode>('Default');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const moves = useMemo(
    () => queryMoves(ch.moves, search, filters, sort, desc, favorites),
    [ch, search, filters, sort, desc, favorites],
  );
  const toggle = (f: Filter) => setFilters((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));
  const onSort = (k: SortKey) => { if (sort === k) setDesc(!desc); else { setSort(k); setDesc(k === 'damage'); } };
  const arrow = (k: SortKey) => (sort === k ? (desc ? ' ▼' : ' ▲') : ' ⇅');

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchRow}>
        <TextInput
          style={s.input} placeholder="Search moves, e.g. d/f+2, launcher" placeholderTextColor={c.mute}
          value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false}
        />
      </View>
      <View style={s.ctrlRow}>
        <Pressable style={s.select} onPress={() => setShowSort(!showSort)}>
          <Text style={s.selectText}>Sort by: {SORTS.find((x) => x.key === sort)?.label} ▾</Text>
        </Pressable>
        <Pressable style={s.filterBtn} onPress={() => setShowFilters(!showFilters)}>
          <Text style={s.filterText}>Filter{filters.length ? ` (${filters.length})` : ''}</Text>
        </Pressable>
      </View>
      {showSort && (
        <View style={s.panel}>
          {SORTS.map((o) => (
            <Pressable key={o.label} onPress={() => { setSort(o.key); setDesc(o.key === 'damage'); setShowSort(false); }}>
              <Text style={[s.opt, sort === o.key && { color: c.amber }]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {FILTERS.map((f) => (
            <Pressable key={f.key} onPress={() => toggle(f.key)} style={[s.chip, filters.includes(f.key) && s.chipOn]}>
              <Text style={s.chipText}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View style={s.modeRow}>
        <Text style={s.mute}>View mode</Text>
        {MODES.map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[s.modeBtn, mode === m && s.modeOn]}>
            <Text style={s.chipText}>{m}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.head}>
        {mode !== 'Compact' && (
          <Pressable style={{ flex: 0.8 }} onPress={() => onSort('level')}><Text style={s.hCell}>LVL{arrow('level')}</Text></Pressable>
        )}
        <Pressable style={{ flex: 1 }} onPress={() => onSort('startup')}><Text style={s.hCell}>START{arrow('startup')}</Text></Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => onSort('onBlock')}><Text style={s.hCell}>BLOCK{arrow('onBlock')}</Text></Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => onSort('onHit')}><Text style={s.hCell}>HIT{arrow('onHit')}</Text></Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => onSort('onCounterHit')}><Text style={s.hCell}>CH{arrow('onCounterHit')}</Text></Pressable>
      </View>
      <FlatList
        data={moves}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListEmptyComponent={<Text style={s.empty}>No moves match</Text>}
        renderItem={({ item }) => (
          <Row
            m={item} mode={mode} editing={!!editing} fav={favorites.includes(item.id)}
            expanded={open === item.id || mode === 'Detailed'}
            onFav={() => toggleFavorite(item.id)}
            onExpand={() => setOpen(open === item.id ? null : item.id)}
          />
        )}
      />
    </View>
  );
}

function Row({ m, mode, editing, fav, expanded, onFav, onExpand }: {
  m: Move; mode: Mode; editing: boolean; fav: boolean; expanded: boolean; onFav: () => void; onExpand: () => void;
}) {
  const { clips, setClip } = useStore();
  return (
    <View style={s.card}>
      <View style={s.titleRow}>
        <Text style={s.notation} numberOfLines={1}>{m.notation}</Text>
        {mode !== 'Compact' && m.tags.map((t) => (
          <View key={t} style={s.badge}><Text style={s.badgeText}>{t}</Text></View>
        ))}
        <View style={{ flex: 1 }} />
        <PlayButton move={m} />
        <Pressable onPress={onFav} hitSlop={10} accessibilityLabel={fav ? 'Remove favorite' : 'Add favorite'}>
          <Text style={[s.icon, fav && { color: c.minus }]}>{fav ? '♥' : '♡'}</Text>
        </Pressable>
        <Pressable onPress={onExpand} hitSlop={10} accessibilityLabel="Expand">
          <Text style={s.icon}>{expanded ? '▴' : '▾'}</Text>
        </Pressable>
      </View>
      <View style={s.valRow}>
        {mode !== 'Compact' && <Text style={[s.val, { flex: 0.8, color: c.mute }]}>{m.hitLevel}</Text>}
        <Text style={[s.val, { fontWeight: '800' }]}>{cell(m.startup)}</Text>
        <Text style={[s.val, { color: advColor(m.onBlock) }]}>{cell(m.onBlock)}</Text>
        <Text style={[s.val, { color: advColor(m.onHit) }]}>{cell(m.onHit)}</Text>
        <Text style={[s.val, { color: advColor(m.onCounterHit) }]}>{cell(m.onCounterHit)}</Text>
      </View>
      {expanded && (
        <View style={s.more}>
          <Text style={s.moreText}>Startup: {m.startup || '—'}   Block: {m.onBlock || '—'}</Text>
          <Text style={s.moreText}>Hit: {m.onHit || '—'}   CH: {m.onCounterHit || '—'}</Text>
          <Text style={s.moreText}>Damage: {m.damage || '—'}</Text>
          <Text style={s.moreText}>Properties: {m.tags.length ? m.tags.join(', ') : 'none'}</Text>
          {!!m.name && <Text style={s.moreText}>Name: {m.name}</Text>}
          {!!m.notes && <Text style={s.moreText}>Notes: {m.notes}</Text>}
          {editing && (
            <TextInput
              style={s.input} placeholder={m.clipUrl ? "Custom clip URL (blank = wavu clip)" : "Clip URL (https://...)"} placeholderTextColor={c.mute}
              value={clips[m.id] ?? ''} onChangeText={(t) => setClip(m.id, t)}
              autoCapitalize="none" autoCorrect={false} keyboardType="url"
            />
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  searchRow: { padding: 12, paddingBottom: 6 },
  input: { padding: 12, borderRadius: 10, backgroundColor: c.input, borderWidth: 1, borderColor: c.border, color: c.text },
  ctrlRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, gap: 10 },
  select: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: c.input, borderWidth: 1, borderColor: c.border },
  selectText: { color: c.text },
  filterBtn: { paddingHorizontal: 22, justifyContent: 'center', borderRadius: 10, backgroundColor: c.amberDark },
  filterText: { color: c.text, fontWeight: '700' },
  panel: { margin: 12, marginBottom: 0, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  opt: { color: c.text, padding: 12 },
  chips: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: c.input, borderWidth: 1, borderColor: c.border },
  chipOn: { backgroundColor: c.amberDark, borderColor: c.amber },
  chipText: { color: c.text, fontSize: 13 },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10 },
  mute: { color: c.mute, marginRight: 4 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: c.input },
  modeOn: { backgroundColor: c.amberDark },
  head: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 14, paddingBottom: 4 },
  hCell: { color: c.mute, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notation: { color: c.amber, fontSize: 18, fontWeight: '800', flexShrink: 1 },
  badge: { backgroundColor: c.amberDim, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: c.amber, fontSize: 10, fontWeight: '700' },
  icon: { color: c.mute, fontSize: 22, paddingHorizontal: 4 },
  valRow: { flexDirection: 'row', marginTop: 8 },
  val: { flex: 1, color: c.text, textAlign: 'center', fontSize: 14 },
  more: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: c.border, gap: 4 },
  moreText: { color: '#cfcfcf', fontSize: 13 },
  empty: { color: c.mute, textAlign: 'center', marginTop: 40 },
});
