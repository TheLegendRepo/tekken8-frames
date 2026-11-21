export interface Move {
  id: string;
  notation: string;
  hitLevel: string; // e.g. "h", "m", "l", "m,m"
  // Display strings exactly as in the source (e.g. "i15~16", "-13~-12", "+13a"); empty string = no data.
  startup: string;
  onBlock: string;
  onHit: string;
  onCounterHit: string;
  damage: string; // e.g. "10,12"
  tags: string[]; // launcher, homing, powercrush, ...
  notes?: string;
  name?: string; // optional move name
  clipUrl?: string;
  sourceId?: string; // optional video clip URL, empty until real clips are added
}

export interface Section {
  title: string;
  body: string;
}

export interface Character {
  id: string;
  name: string;
  moves: Move[];
  guide?: Section[];
  antiStrats?: Section[];
}

export interface FrameDataset {
  meta: { game: string; isSample: boolean; source: string; attribution?: string };
  characters: Character[];
}
