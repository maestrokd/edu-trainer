import type { CreatureBehavior } from "./entities";

// One distinct world per level (decided 2026-07-19, after the "levels 1/4/5
// look identical" playtest feedback). A world is pure data: palette + roster
// + boss. Physics, spawning, and difficulty scaling stay world-agnostic.
//
// Creature rule (decided 2026-07-19): creatures are ALWAYS real animals
// native to the world's area — never ghosts, zombies, or monsters, and not
// the 🐺 head emoji. Fantasy (trolls, witches, dragons, zombies) is allowed
// for BOSSES only. Behaviors stay predictable across worlds: walkers walk,
// flyers fly — only the skins change, so a child's reflexes transfer.

/** the 6-color background/terrain palette of a world (see render.ts) */
export interface WorldPalette {
  skyTop: string;
  skyBottom: string;
  hillFar: string;
  hillNear: string;
  ground: string;
  groundTop: string;
}

export interface WorldCreature {
  emoji: string;
  behavior: CreatureBehavior;
}

export interface WorldTheme {
  /** stable id — hook for future i18n world names / map art */
  key: string;
  palette: WorldPalette;
  /** area-native real animals only (see rule above) */
  creatures: WorldCreature[];
  /** the stage boss emoji — also shown on the world map and the boss bar */
  boss: string;
  /** "knight" renders the boss as the vector-drawn Black Knight; default is the emoji */
  bossKind?: "knight";
}

/** index 0 = level 1 … index 14 = level 15 */
export const WORLDS: WorldTheme[] = [
  {
    // level 1 — the original meadow, kept as the gentle start
    key: "meadow",
    palette: {
      skyTop: "#8ed8f8",
      skyBottom: "#dff2c8",
      hillFar: "#a5cf8f",
      hillNear: "#7cb46a",
      ground: "#6b4f35",
      groundTop: "#8bc34a",
    },
    creatures: [
      { emoji: "🐌", behavior: "walker" },
      { emoji: "🐝", behavior: "flyer" },
    ],
    boss: "🧌",
  },
  {
    // level 2 — a blooming garden at morning
    key: "garden",
    palette: {
      skyTop: "#a8dcf5",
      skyBottom: "#fbe4ec",
      hillFar: "#b7d98f",
      hillNear: "#8cc06a",
      ground: "#6d4c33",
      groundTop: "#7fbf4d",
    },
    creatures: [
      { emoji: "🐛", behavior: "walker" },
      { emoji: "🐞", behavior: "flyer" },
    ],
    boss: "🐗",
  },
  {
    // level 3 — deep green forest
    key: "forest",
    palette: {
      skyTop: "#79c1e8",
      skyBottom: "#cfe8b8",
      hillFar: "#5f9e57",
      hillNear: "#3f7a3d",
      ground: "#4f3a28",
      groundTop: "#5c8f45",
    },
    creatures: [
      { emoji: "🦡", behavior: "walker" },
      { emoji: "🦉", behavior: "flyer" },
    ],
    boss: "🐻",
  },
  {
    // level 4 — lakeside shallows
    key: "lake",
    palette: {
      skyTop: "#7ec8ef",
      skyBottom: "#d2f0ea",
      hillFar: "#7fc9b7",
      hillNear: "#58a897",
      ground: "#5a6b4a",
      groundTop: "#6aa86f",
    },
    creatures: [
      { emoji: "🐸", behavior: "walker" },
      { emoji: "🦆", behavior: "flyer" },
    ],
    boss: "🐊",
  },
  {
    // level 5 — golden farm fields
    key: "farm",
    palette: {
      skyTop: "#9fd3f2",
      skyBottom: "#fdf0c0",
      hillFar: "#d9c27a",
      hillNear: "#b89b4e",
      ground: "#7a5a34",
      groundTop: "#d9b656",
    },
    creatures: [
      { emoji: "🐓", behavior: "walker" },
      { emoji: "🦢", behavior: "flyer" },
    ],
    boss: "🐂",
  },
  {
    // level 6 — the original sunset desert; camel & kit fox, snake boss
    key: "desert",
    palette: {
      skyTop: "#f7b26b",
      skyBottom: "#f8e3b0",
      hillFar: "#c98d5a",
      hillNear: "#8f6544",
      ground: "#5d4030",
      groundTop: "#a1793f",
    },
    creatures: [
      { emoji: "🐫", behavior: "walker" },
      { emoji: "🦊", behavior: "walker" },
    ],
    boss: "🐍",
  },
  {
    // level 7 — turquoise beach
    key: "beach",
    palette: {
      skyTop: "#6fc7ef",
      skyBottom: "#cdeff5",
      hillFar: "#8fd8d2",
      hillNear: "#5db8c9",
      ground: "#8a6f4d",
      groundTop: "#e8cf9b",
    },
    creatures: [
      { emoji: "🦀", behavior: "walker" },
      { emoji: "🦩", behavior: "flyer" },
    ],
    boss: "🐙",
  },
  {
    // level 8 — lush jungle
    key: "jungle",
    palette: {
      skyTop: "#6fbf9a",
      skyBottom: "#d8ecac",
      hillFar: "#3f8f52",
      hillNear: "#2c6e3e",
      ground: "#4a3b26",
      groundTop: "#3e8f3e",
    },
    creatures: [
      { emoji: "🐒", behavior: "walker" },
      { emoji: "🦜", behavior: "flyer" },
    ],
    boss: "🦍",
  },
  {
    // level 9 — gray-blue mountain peaks; the Black Knight guards the pass
    key: "mountains",
    palette: {
      skyTop: "#9fb8d8",
      skyBottom: "#e3ecf5",
      hillFar: "#8f9bb0",
      hillNear: "#6b7890",
      ground: "#5a5f6b",
      groundTop: "#8f97a5",
    },
    creatures: [
      { emoji: "🐐", behavior: "walker" },
      { emoji: "🦅", behavior: "flyer" },
    ],
    boss: "⚔️",
    bossKind: "knight",
  },
  {
    // level 10 — antarctic ice shelf
    key: "antarctica",
    palette: {
      skyTop: "#a8d8f0",
      skyBottom: "#eef8ff",
      hillFar: "#cfe6f2",
      hillNear: "#a9cfe4",
      ground: "#6f8fa8",
      groundTop: "#e8f4fb",
    },
    creatures: [
      { emoji: "🐧", behavior: "walker" },
      { emoji: "🦭", behavior: "walker" },
    ],
    boss: "☃️",
  },
  {
    // level 11 — smoggy city dusk; sparrows & raccoons, rat boss
    key: "city",
    palette: {
      skyTop: "#6f7fa8",
      skyBottom: "#d8c8a8",
      hillFar: "#7a8296",
      hillNear: "#565e72",
      ground: "#4a4a52",
      groundTop: "#8a8a94",
    },
    creatures: [
      { emoji: "🦝", behavior: "walker" },
      { emoji: "🐦", behavior: "flyer" },
    ],
    boss: "🐀",
  },
  {
    // level 12 — indoors: wallpapered halls and wooden floors; cat & mouse
    key: "building",
    palette: {
      skyTop: "#d8c8b0",
      skyBottom: "#efe4d0",
      hillFar: "#c9b393",
      hillNear: "#a58b6b",
      ground: "#6a4a33",
      groundTop: "#8a5f40",
    },
    creatures: [
      { emoji: "🐈", behavior: "walker" },
      { emoji: "🐁", behavior: "walker" },
    ],
    boss: "🤖",
  },
  {
    // level 13 — dim cave; bats & cave spiders are exactly where they belong.
    // Boss: the Black Knight (vector-rendered mirror of the hero); ⚔️ is his
    // world-map/boss-bar icon — a knight's duel
    key: "cave",
    palette: {
      skyTop: "#262233",
      skyBottom: "#5d5268",
      hillFar: "#3f3a4d",
      hillNear: "#2f2b3c",
      ground: "#3b3040",
      groundTop: "#5f5468",
    },
    creatures: [
      { emoji: "🕷️", behavior: "walker" },
      { emoji: "🦇", behavior: "flyer" },
    ],
    boss: "⚔️",
    bossKind: "knight",
  },
  {
    // level 14 — the original purple night, now a haunted castle courtyard
    key: "castle",
    palette: {
      skyTop: "#3b3a63",
      skyBottom: "#7a6a9c",
      hillFar: "#57517d",
      hillNear: "#3f3a5e",
      ground: "#403148",
      groundTop: "#6a5a80",
    },
    creatures: [
      { emoji: "🦚", behavior: "walker" },
      { emoji: "🕊️", behavior: "flyer" },
    ],
    boss: "🧙",
  },
  {
    // level 15 — the dragon's volcanic keep: the grand finale
    key: "volcano",
    palette: {
      skyTop: "#3a2028",
      skyBottom: "#7a3a2a",
      hillFar: "#4f2a30",
      hillNear: "#38202a",
      ground: "#2f2226",
      groundTop: "#a84a28",
    },
    creatures: [
      { emoji: "🦎", behavior: "walker" },
      { emoji: "🦇", behavior: "flyer" },
    ],
    boss: "🐉",
  },
];

export function worldFor(level: number): WorldTheme {
  return WORLDS[Math.min(WORLDS.length - 1, Math.max(0, Math.round(level) - 1))];
}
