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
  sourceId?: string; // wavu.wiki Move id, e.g. "Alisa-1,2"
  clipUrl?: string; // direct MP4 URL, streamed in the app (scripts/import_clips.py)
  clipSource?: 'wavu' | 'tekkendocs'; // site that hosts clipUrl
  clipFrom?: string; // set when clipUrl is the clip of a longer string starting with this move, e.g. "1,1"
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
