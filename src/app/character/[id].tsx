import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CheatSheet from '../../components/CheatSheet';
import FlashCards from '../../components/FlashCards';
import NotesSections from '../../components/NotesSections';
import FrameList from '../../components/FrameList';
import { getCharacter } from '../../data';
import { c, heading } from '../../theme';

const TABS = ['Frame Data', 'Guide', 'Cheat Sheet', 'Anti Strats', 'Flash Card'] as const;

export default function CharacterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ch = getCharacter(id);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Frame Data');
  if (!ch) return <Text style={{ color: c.mute, textAlign: 'center', marginTop: 40 }}>Character not found</Text>;
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: ch.name.toUpperCase() }} />
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.initial}>{ch.name[0]}</Text></View>
        <Text style={s.name}>{ch.name.toUpperCase()}</Text>
        <Pressable onPress={() => setEditing(!editing)} hitSlop={10}>
          <Text style={s.edit}>{editing ? '✓ Done' : '✎ Edit'}</Text>
        </Pressable>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {TABS.map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]}>
              <Text style={[s.tabText, tab === t && { color: c.amber }]}>{t.toUpperCase()}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {tab === 'Frame Data' && <FrameList ch={ch} editing={editing} />}
      {tab === 'Guide' && <NotesSections ch={ch} kind="guide" />}
      {tab === 'Anti Strats' && <NotesSections ch={ch} kind="anti" />}
      {tab === 'Cheat Sheet' && <CheatSheet ch={ch} />}
      {tab === 'Flash Card' && <FlashCards ch={ch} />}
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 10, backgroundColor: c.amberDim, alignItems: 'center', justifyContent: 'center' },
  initial: { ...heading, color: c.amber, fontSize: 26 },
  name: { ...heading, color: c.text, fontSize: 26, flex: 1 },
  edit: { color: c.amber, fontSize: 16 },
  tabs: { paddingHorizontal: 14, gap: 22 },
  tab: { paddingVertical: 10, borderBottomWidth: 3, borderColor: 'transparent' },
  tabOn: { borderColor: c.amber },
  tabText: { ...heading, color: c.text, fontSize: 15 },
});
