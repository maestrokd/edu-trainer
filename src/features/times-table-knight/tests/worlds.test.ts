import { describe, expect, it } from "vitest";
import { WORLDS, worldFor } from "../game/worlds";
import { MAX_LEVEL, MIN_LEVEL } from "../model/game.constants";

// Creature rule (2026-07-19): creatures are real, area-native animals only.
// Fantasy figures may appear as bosses, never as stage creatures.
const FANTASY_EMOJI = ["👻", "🧟", "🧌", "🧙", "👹", "👺", "💀", "🐉", "🐲", "🤖", "☃️", "🗿"];
// the 🐺 head emoji reads as comical, not as a creature (playtest feedback)
const BANNED_CREATURES = [...FANTASY_EMOJI, "🐺"];

describe("worlds", () => {
  it("defines one distinct world per level", () => {
    expect(WORLDS).toHaveLength(MAX_LEVEL - MIN_LEVEL + 1);
    expect(new Set(WORLDS.map((w) => w.key)).size).toBe(WORLDS.length);
    // emoji bosses are unique; Black Knight duels all share the ⚔️ icon
    const emojiBosses = WORLDS.filter((w) => w.bossKind !== "knight").map((w) => w.boss);
    expect(new Set(emojiBosses).size).toBe(emojiBosses.length);
    for (const world of WORLDS) {
      if (world.bossKind === "knight") expect(world.boss).toBe("⚔️");
    }
  });

  it("maps levels to worlds and clamps out-of-range levels", () => {
    expect(worldFor(MIN_LEVEL)).toBe(WORLDS[0]);
    expect(worldFor(MAX_LEVEL)).toBe(WORLDS[WORLDS.length - 1]);
    expect(worldFor(MIN_LEVEL - 1)).toBe(WORLDS[0]);
    expect(worldFor(MAX_LEVEL + 10)).toBe(WORLDS[WORLDS.length - 1]);
  });

  it("keeps creatures real and area-native — fantasy is boss-only", () => {
    for (const world of WORLDS) {
      expect(world.creatures.length).toBeGreaterThanOrEqual(2);
      for (const creature of world.creatures) {
        expect(BANNED_CREATURES).not.toContain(creature.emoji);
        expect(["walker", "flyer"]).toContain(creature.behavior);
      }
    }
  });

  it("honors the decided area assignments", () => {
    const byKey = Object.fromEntries(WORLDS.map((w) => [w.key, w]));
    expect(byKey.desert.boss).toBe("🐍");
    expect(byKey.desert.creatures.map((c) => c.emoji)).toEqual(["🐫", "🦊"]);
    expect(byKey.city.boss).toBe("🐀");
    expect(byKey.building.creatures.map((c) => c.emoji)).toEqual(["🐈", "🐁"]);
  });

  it("has a complete 6-color palette per world", () => {
    for (const world of WORLDS) {
      const colors = Object.values(world.palette);
      expect(colors).toHaveLength(6);
      for (const color of colors) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});
