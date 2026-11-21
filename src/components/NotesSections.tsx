import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Character } from '../data/types';
import { useStore } from '../store';
import { c, heading } from '../theme';

// Guide / Anti Strats: sections come from the dataset; "My notes" is saved on the device.
export default function NotesSections({ ch, kind }: { ch: Character; kind: 'guide' | 'anti' }) {
  const { notes, setNote } = useStore();
  const sections = (kind === 'guide' ? ch.guide : ch.antiStrats) ?? [];
  const key = `${ch.id}:${kind}`;
  return (
    <ScrollView contentContainerStyle={{ padding: 14, gap: 14 }} keyboardShouldPersistTaps="handled">
      {sections.length === 0 && (
        <Text style={s.mute}>
          No {kind === 'guide' ? 'guide' : 'anti-strat'} content in the data yet. Add it to framedata.json.
        </Text>
      )}
      {sections.map((x, i) => (
        <View key={i} style={s.card}>
          <Text style={s.h}>{x.title}</Text>
          <Text style={s.body}>{x.body}</Text>
        </View>
      ))}
      <View style={s.card}>
        <Text style={s.h}>My notes</Text>
        <TextInput
          style={s.input} multiline placeholder="Write your own notes (saved on this device)"
          placeholderTextColor={c.mute} value={notes[key] ?? ''} onChangeText={(t) => setNote(key, t)}
        />
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  mute: { color: c.mute },
  card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 14, gap: 8 },
  h: { ...heading, color: c.text, fontSize: 18 },
  body: { color: '#cfcfcf', lineHeight: 21 },
  input: { minHeight: 120, color: c.text, backgroundColor: c.input, borderRadius: 8, padding: 10, textAlignVertical: 'top' },
});
