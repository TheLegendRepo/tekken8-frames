import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { Move } from '../data/types';
import { useStore } from '../store';
import { c } from '../theme';
import ClipPlayer from './ClipPlayer';

/** The clip to play: a user-entered URL wins over the wavu clip from the dataset. */
export const useClip = (m: Move) => {
  const { clips } = useStore();
  const own = (clips[m.id] || '').trim();
  return own ? { url: own, from: undefined } : { url: (m.clipUrl || '').trim(), from: m.clipFrom };
};

// Opens the move's page, which plays its clip. With `inline`, plays the clip in place instead
// (used on flash cards, where the move page would give the answer away).
export default function PlayButton({ move, big, inline }: { move: Move; big?: boolean; inline?: boolean }) {
  const { url, from } = useClip(move);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const press = () => {
    if (!inline) return router.push({ pathname: '/move/[id]', params: { id: move.id } });
    if (!url) return setMsg('No clip for this move yet.');
    if (!/^https?:\/\//i.test(url)) return setMsg('Clip URL must start with http(s)://');
    setMsg('');
    setOpen(!open);
  };
  return (
    <>
      <Pressable onPress={press} style={[s.btn, big && s.big, !url && { opacity: 0.55 }]}
        accessibilityLabel={inline ? (open ? 'Hide clip' : 'Play clip') : 'Open move and play clip'}>
        <Text style={[s.icon, big && { fontSize: 26 }]}>{inline && open ? '■' : '▶'}</Text>
      </Pressable>
      {!!msg && <Text style={s.msg}>{msg}</Text>}
      {inline && open && !!url && <ClipPlayer url={url} from={from} />}
    </>
  );
}
const s = StyleSheet.create({
  btn: { backgroundColor: c.amberDim, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  big: { paddingHorizontal: 30, paddingVertical: 14, backgroundColor: '#111', borderWidth: 1, borderColor: c.border },
  icon: { color: c.amber, fontSize: 16 },
  msg: { color: c.mute, fontSize: 12, textAlign: 'center' },
});
