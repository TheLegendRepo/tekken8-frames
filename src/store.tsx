import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export type CardStatus = 'correct' | 'wrong' | 'ignored';
export type CardProgress = Record<string, CardStatus>; // key: moveId

interface Store {
  favorites: string[];
  toggleFavorite: (moveId: string) => void;
  progress: CardProgress;
  setCard: (moveId: string, s: CardStatus) => void;
  resetProgress: (moveIds: string[]) => void;
  clips: Record<string, string>; // user-entered clip URLs by moveId
  setClip: (moveId: string, url: string) => void;
  notes: Record<string, string>; // user notes, key `${characterId}:${guide|anti}`
  setNote: (key: string, text: string) => void;
}
const Ctx = createContext<Store | null>(null);
const KEY = 't8frames.v1';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [progress, setProgress] = useState<CardProgress>({});
  const [clips, setClips] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const d = JSON.parse(raw);
          setFavorites(d.favorites ?? []);
          setProgress(d.progress ?? {});
          setClips(d.clips ?? {});
          setNotes(d.notes ?? {});
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify({ favorites, progress, clips, notes })).catch(() => {});
  }, [favorites, progress, clips, notes, loaded]);

  const toggleFavorite = useCallback(
    (id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), []);
  const setCard = useCallback((id: string, s: CardStatus) => setProgress((p) => ({ ...p, [id]: s })), []);
  const resetProgress = useCallback((ids: string[]) =>
    setProgress((p) => { const n = { ...p }; ids.forEach((i) => delete n[i]); return n; }), []);
  const setClip = useCallback((id: string, url: string) => setClips((p) => ({ ...p, [id]: url })), []);
  const setNote = useCallback((k: string, t: string) => setNotes((p) => ({ ...p, [k]: t })), []);

  return (
    <Ctx.Provider value={{ favorites, toggleFavorite, progress, setCard, resetProgress, clips, setClip, notes, setNote }}>
      {children}
    </Ctx.Provider>
  );
}
export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
};
