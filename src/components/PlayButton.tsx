import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import type { Move } from '../data/types';
import { useStore } from '../store';
import { c } from '../theme';

export const useClip = (m: Move) => {
  const { clips } = useStore();
  return (clips[m.id] || m.clipUrl || '').trim();
};

// Opens the clip URL (user-entered or from the dataset) in the device's player/browser.
export default function PlayButton({ move, big }: { move: Move; big?: boolean }) {
  const url = useClip(move);
  const [msg, setMsg] = useState('');
  const press = async () => {
    if (!url) return setMsg('No clip yet. Add a URL under Edit.');
    if (!/^https?:\/\//i.test(url)) return setMsg('Clip URL must start with http(s)://');
    try { await Linking.openURL(url); setMsg(''); } catch { setMsg('Could not open clip'); }
  };
  return (
    <>
      <Pressable onPress={press} style={[s.btn, big && s.big, !url && { opacity: 0.55 }]} accessibilityLabel="Play clip">
        <Text style={[s.icon, big && { fontSize: 26 }]}>▶</Text>
      </Pressable>
      {!!msg && <Text style={s.msg}>{msg}</Text>}
    </>
  );
}
const s = StyleSheet.create({
  btn: { backgroundColor: c.amberDim, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  big: { paddingHorizontal: 30, paddingVertical: 14, backgroundColor: '#111', borderWidth: 1, borderColor: c.border },
  icon: { color: c.amber, fontSize: 16 },
  msg: { color: c.mute, fontSize: 12, textAlign: 'center' },
});
