import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { c } from '../theme';

const SPEEDS = [0.25, 0.5, 1] as const;

// Streams a move clip in place: muted, looping, with slow-motion buttons for reading frames.
export default function ClipPlayer({ url, from }: { url: string; from?: string }) {
  const [speed, setSpeed] = useState<number>(1);
  const player = useVideoPlayer({ uri: url, useCaching: true }, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status, error: undefined });
  // On web the initial play() can land before the source is ready, so start again once it is.
  useEventListener(player, 'statusChange', ({ status: st }) => { if (st === 'readyToPlay' && !player.playing) player.play(); });
  const changeSpeed = (v: number) => {
    // expo-video players are configured by setting properties on the player object.
    // eslint-disable-next-line react-hooks/immutability
    player.playbackRate = v;
    setSpeed(v);
  };

  return (
    <View style={s.wrap}>
      <View style={s.frame}>
        <VideoView player={player} style={s.video} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} />
        {status === 'loading' && <Text style={s.overlay}>Loading clip…</Text>}
        {status === 'error' && (
          <View style={s.errBox}>
            <Text style={s.overlay}>{error?.message ? 'Could not play this clip here.' : 'Could not load clip.'}</Text>
            {Platform.OS === 'web' ? (
              // A real link on web, since pages in sandboxed frames often block window.open.
              <Text style={s.link} {...({ href: url, hrefAttrs: { target: '_blank', rel: 'noopener' } } as object)}>Open clip in a new tab</Text>
            ) : (
              <Pressable onPress={() => Linking.openURL(url).catch(() => {})}>
                <Text style={s.link}>Open in browser</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
      <View style={s.bar}>
        <Text style={s.from} numberOfLines={1}>{from ? `Clip shows the full string ${from}` : ' '}</Text>
        {SPEEDS.map((v) => (
          <Pressable key={v} onPress={() => changeSpeed(v)} style={[s.speed, speed === v && s.speedOn]} hitSlop={6}
            accessibilityLabel={`Play at ${v}x speed`}>
            <Text style={[s.speedText, speed === v && { color: c.amber }]}>{v}x</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 8, alignSelf: 'stretch' },
  frame: { aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: c.border, justifyContent: 'center' },
  video: { ...StyleSheet.absoluteFill },
  overlay: { color: c.mute, textAlign: 'center' },
  errBox: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#000' },
  link: { color: c.amber, fontWeight: '700' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  from: { color: c.mute, fontSize: 12, flex: 1 },
  speed: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: c.input },
  speedOn: { backgroundColor: c.amberDim },
  speedText: { color: c.text, fontSize: 13, fontWeight: '700' },
});
