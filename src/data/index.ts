import raw from './framedata.json';
import type { Character, FrameDataset, Move } from './types';

// Swap src/data/framedata.json for real data matching types.ts; nothing else changes.
export const dataset = raw as unknown as FrameDataset;
export const characters: Character[] = dataset.characters;
export const getCharacter = (id?: string) => characters.find((c) => c.id === id);

let moveIndex: Map<string, { ch: Character; move: Move }> | null = null;
export const getMove = (id?: string) => {
  if (!moveIndex) {
    moveIndex = new Map();
    for (const ch of characters) for (const move of ch.moves) moveIndex.set(move.id, { ch, move });
  }
  return id ? moveIndex.get(id) : undefined;
};

/** First integer in a frame string ("i15~16" -> 15, "-13~-12" -> -13, "+13a" -> 13); null if none. */
export const numOf = (s: string): number | null => {
  const m = /[+-]?\d+/.exec(s);
  return m ? parseInt(m[0], 10) : null;
};
/** Value for display in a table cell: first comma-separated part, or a dash when empty. */
export const cell = (s: string) => (s.trim() ? s.split(',')[0].trim() : '\u2014');
export const isLauncher = (m: Move) => m.tags.includes('launcher');

export const totalDamage = (d: string) =>
  d.split(',').reduce((s, x) => s + (parseInt(x, 10) || 0), 0);

export type SortKey = 'level' | 'startup' | 'onBlock' | 'onHit' | 'onCounterHit' | 'damage';
export type Filter = 'launcher' | 'i10-i15' | 'safe' | 'homing' | 'powercrush' | 'favorites';

const levelRank = (l: string) => ({ h: 0, m: 1, l: 2 } as Record<string, number>)[l.trim().charAt(0).toLowerCase()] ?? 3;

export function queryMoves(
  moves: Move[], search: string, filters: Filter[], sort: SortKey | null, desc: boolean, favorites: string[] = [],
): Move[] {
  const q = search.trim().toLowerCase();
  let out = moves.filter((m) => {
    if (q && !m.notation.toLowerCase().includes(q) && !(m.name ?? '').toLowerCase().includes(q)
      && !m.tags.some((t) => t.includes(q))) return false;
    return filters.every((f) => {
      const st = numOf(m.startup);
      const bl = numOf(m.onBlock);
      switch (f) {
        case 'favorites': return favorites.includes(m.id);
        case 'launcher': return isLauncher(m);
        case 'homing': return m.tags.includes('homing');
        case 'powercrush': return m.tags.includes('powercrush');
        case 'i10-i15': return st !== null && st >= 10 && st <= 15;
        case 'safe': return bl !== null && bl >= -9;
      }
    });
  });
  if (sort) {
    const val = (m: Move) => {
      if (sort === 'level') return levelRank(m.hitLevel);
      if (sort === 'damage') return totalDamage(m.damage);
      const n = numOf(m[sort]);
      return n ?? (desc ? -999 : 999); // missing values always sort last
    };
    out = [...out].sort((a, b) => (desc ? val(b) - val(a) : val(a) - val(b)));
  }
  return out;
}
