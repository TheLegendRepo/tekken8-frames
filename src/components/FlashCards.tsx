import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Filter, queryMoves } from '../data';
import type { Character, Move } from '../data/types';
import { useStore } from '../store';
import { c, heading } from '../theme';
import PlayButton from './PlayButton';

type Prop = 'startup' | 'onBlock' | 'hit' | 'hitLevel' | 'tags';
const PROPS: { key: Prop; q: string }[] = [
  { key: 'onBlock', q: 'Frames on block?' },
  { key: 'startup', q: 'Startup?' },
  { key: 'hit', q: 'Frames on hit / counter hit?' },
  { key: 'hitLevel', q: 'Hit level?' },
  { key: 'tags', q: 'Properties?' },
];
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'favorites', label: '♥ Favorites' }, { key: 'launcher', label: 'Launchers' },
  { key: 'i10-i15', label: 'i10-i15' }, { key: 'safe', label: 'Safe' },
  { key: 'homing', label: 'Homing' }, { key: 'powercrush', label: 'Power crush' },
];

export default function FlashCards({ ch }: { ch: Character }) {
  const { progress, setCard, resetProgress, favorites } = useStore();
  const [active, setActive] = useState(false);
  const [card, setCard_] = useState<{ move: Move; prop: (typeof PROPS)[number] } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [details, setDetails] = useState(false);
  const [how, setHow] = useState(false);
  const [adv, setAdv] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [countTxt, setCountTxt] = useState('');
  const [startTxt, setStartTxt] = useState('1');
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // Practice set: filter, then "start from move #", then "number of moves".
  const practice = useMemo(() => {
    const base = queryMoves(ch.moves, '', filters, null, false, favorites);
    const start = Math.min(Math.max(parseInt(startTxt, 10) || 1, 1), Math.max(base.length, 1));
    const n = Math.min(Math.max(parseInt(countTxt, 10) || base.length, 1), base.length || 1);
    return base.slice(start - 1, start - 1 + n);
  }, [ch, filters, favorites, startTxt, countTxt]);

  const counts = useMemo(() => {
    const r = { correct: 0, wrong: 0, ignored: 0, unseen: 0 };
    practice.forEach((m) => { const s = progress[m.id]; if (s) r[s]++; else r.unseen++; });
    return r;
  }, [practice, progress]);
  const done = counts.correct + counts.wrong + counts.ignored;
  const medal = counts.correct === practice.length && practice.length > 0 ? '🥇' : counts.correct * 2 >= practice.length && practice.length > 0 ? '🥈' : '🥉';

  const next = () => {
    // Wrong cards are 3x as likely; ignored cards are never shown.
    const pool: Move[] = [];
    practice.forEach((m) => {
      const s = progress[m.id];
      if (s === 'ignored') return;
      for (let i = 0; i < (s === 'wrong' ? 3 : 1); i++) pool.push(m);
    });
    if (!pool.length) { setCard_(null); return; }
    setCard_({ move: pool[Math.floor(Math.random() * pool.length)], prop: PROPS[Math.floor(Math.random() * PROPS.length)] });
    setFlipped(false);
    setDetails(false);
  };
  const grade = (st: 'correct' | 'wrong' | 'ignored') => { if (card) setCard(card.move.id, st); next(); };
  const toggle = (f: Filter) => setFilters((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));

  if (active) {
    const m = card?.move;
    const hi = (p: Prop) => (card?.prop.key === p ? { color: c.amber } : null);
    return (
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.cardBox}>
          {!m ? (
            <Text style={s.q}>No cards left in this practice set.</Text>
          ) : !flipped ? (
            <>
              <Text style={s.notation}>{m.notation}</Text>
              <PlayButton move={m} big />
              <Text style={s.q}>{card!.prop.q}</Text>
              <Pressable style={s.flip} onPress={() => setFlipped(true)}><Text style={s.btnText}>Flip</Text></Pressable>
            </>
          ) : (
            <>
              <Text style={s.notation}>{m.notation}</Text>
              <Field label="Block" v={m.onBlock || '—'} st={hi('onBlock')} />
              <Field label="Startup" v={m.startup || '—'} st={hi('startup')} />
              <Field label="Hit / C.Hit" v={`${m.onHit || '—'} / ${m.onCounterHit || '—'}`} st={hi('hit')} />
              <Field label="Level" v={m.hitLevel} st={hi('hitLevel')} />
              <Field label="Name" v={m.name ?? ''} />
              <Field label="Properties" v={m.tags.join(', ')} st={hi('tags')} />
              <Pressable onPress={() => setDetails(!details)}>
                <Text style={s.link}>View details {details ? '▴' : '▾'}</Text>
              </Pressable>
              {details && <Text style={s.mute}>Damage: {m.damage}{m.notes ? `\n${m.notes}` : ''}</Text>}
              <PlayButton move={m} big />
              <View style={s.btnRow}>
                <Pressable style={[s.grade, { backgroundColor: '#3a1212' }]} onPress={() => grade('wrong')}><Text style={[s.btnText, { color: '#ff8a8a' }]}>Wrong</Text></Pressable>
                <Pressable style={[s.grade, { backgroundColor: '#12301a' }]} onPress={() => grade('correct')}><Text style={[s.btnText, { color: '#8ae79c' }]}>Correct</Text></Pressable>
                <Pressable style={[s.grade, { backgroundColor: '#111', borderWidth: 1, borderColor: c.border }]} onPress={() => grade('ignored')}><Text style={s.btnText}>Ignore</Text></Pressable>
              </View>
            </>
          )}
        </View>
        <Text style={s.mute}>{done} / {practice.length} seen</Text>
        <Pressable onPress={() => setActive(false)}><Text style={s.link}>Done</Text></Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scroll} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.panel}>
          <Text style={s.title}>Flash Cards</Text>
          <Text style={s.mute}>Test your knowledge of {ch.name}'s frame data</Text>
          <Pressable style={s.start} onPress={() => { setActive(true); next(); }}>
            <Text style={s.startText}>Start Practice</Text>
          </Pressable>
          <Pressable style={s.acc} onPress={() => setHow(!how)}>
            <Text style={s.accText}>How it works</Text><Text style={s.mute}>{how ? '▴' : '▾'}</Text>
          </Pressable>
          {how && (
            <Text style={s.mute}>
              Guess a property of the move shown (for example frames on block), then flip to check.
              "Wrong" cards appear more often. "Ignore" hides a card permanently.
            </Text>
          )}
          <View style={s.progRow}>
            <Text style={s.progLabel}>Progress</Text>
            <View style={s.bar}><View style={[s.barFill, { width: `${(done / Math.max(1, practice.length)) * 100}%` }]} /></View>
            <Text style={s.progLabel}>{done} / {practice.length}</Text>
            <Text style={{ fontSize: 26 }}>{medal}</Text>
          </View>
          <View style={s.stats}>
            <Text style={s.statsTitle}>Current Progress</Text>
            <Stat label="Unseen" v={counts.unseen} color={c.text} />
            <Stat label="Correct" v={counts.correct} color={c.plus} />
            <Stat label="Wrong" v={counts.wrong} color={c.minus} />
            <Stat label="Ignored" v={counts.ignored} color={c.text} />
          </View>
          <Pressable style={s.acc} onPress={() => setAdv(!adv)}>
            <Text style={s.accText}>Advanced Settings</Text><Text style={s.mute}>{adv ? '▴' : '▾'}</Text>
          </Pressable>
          {adv && (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>Filter</Text>
              <View style={s.chips}>
                {FILTERS.map((f) => (
                  <Pressable key={f.key} onPress={() => toggle(f.key)} style={[s.chip, filters.includes(f.key) && s.chipOn]}>
                    <Text style={s.chipText}>{f.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.label}>Number of moves to practice (1 - {Math.max(practice.length, 1)})</Text>
              <TextInput style={s.input} keyboardType="number-pad" value={countTxt} onChangeText={setCountTxt}
                placeholder="All" placeholderTextColor={c.mute} />
              <Text style={s.label}>Start from move #</Text>
              <TextInput style={s.input} keyboardType="number-pad" value={startTxt} onChangeText={setStartTxt} />
            </View>
          )}
          <Pressable onPress={() => resetProgress(ch.moves.map((m) => m.id))}>
            <Text style={s.link}>Reset progress</Text>
          </Pressable>
        </View>
      </ScrollView>
      {adv && (
        <Pressable style={s.top} onPress={() => scroll.current?.scrollTo({ y: 0, animated: true })}>
          <Text style={s.topText}>⌃</Text>
        </Pressable>
      )}
    </View>
  );
}
const Field = ({ label, v, st }: { label: string; v: string; st?: object | null }) => (
  <View style={s.field}>
    <Text style={s.fLabel}>{label}</Text>
    <Text style={[s.fVal, st]}>{v}</Text>
  </View>
);
const Stat = ({ label, v, color }: { label: string; v: number; color: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Text style={{ color: c.mute, fontSize: 16 }}>{label}:</Text>
    <Text style={{ color, fontSize: 16 }}>{v}</Text>
  </View>
);

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 14 },
  panel: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 18, gap: 14 },
  title: { ...heading, color: c.text, fontSize: 28, textAlign: 'center' },
  mute: { color: c.mute, textAlign: 'center', lineHeight: 20 },
  start: { backgroundColor: c.amberDark, borderRadius: 10, padding: 16, alignItems: 'center' },
  startText: { color: '#f5dfc3', fontSize: 20 },
  acc: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  accText: { color: c.mute, fontSize: 17 },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progLabel: { color: c.text, fontSize: 16 },
  bar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#161616', overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: c.amber },
  stats: { backgroundColor: '#080808', borderRadius: 12, padding: 16, gap: 8 },
  statsTitle: { color: c.text, fontSize: 18, marginBottom: 4 },
  label: { color: c.text, fontSize: 15 },
  input: { backgroundColor: c.input, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: c.input, borderWidth: 1, borderColor: c.border },
  chipOn: { backgroundColor: c.amberDark, borderColor: c.amber },
  chipText: { color: c.text, fontSize: 13 },
  link: { color: c.amber, textAlign: 'center', padding: 6 },
  top: { position: 'absolute', right: 16, bottom: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#1a0d09', alignItems: 'center', justifyContent: 'center' },
  topText: { color: c.text, fontSize: 24 },
  cardBox: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 20, minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: 14 },
  notation: { color: c.text, fontSize: 32, fontWeight: '700' },
  q: { color: c.mute, fontSize: 18, textAlign: 'center' },
  field: { flexDirection: 'row', alignSelf: 'stretch', paddingHorizontal: 30 },
  fLabel: { color: c.mute, fontSize: 18, flex: 1 },
  fVal: { color: c.text, fontSize: 18, flex: 1 },
  flip: { backgroundColor: '#4f1c0a', borderRadius: 10, paddingHorizontal: 36, paddingVertical: 14 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  grade: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 14 },
  btnText: { color: c.text, fontSize: 17 },
});
