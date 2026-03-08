import { describe, expect, it } from "vitest";
import {
  buildNextSelection,
  buildSelectedTemplatePayload,
  safeParseTemplateJson,
} from "../api/familyTemplateCollectionsApi";

describe("template collections utilities", () => {
  it("parses valid template JSON payload", () => {
    const input = JSON.stringify({
      schemaVersion: "1.0",
      items: [
        { title: "Routine A", starsReward: 3 },
        { title: "Routine B", starsReward: 5 },
      ],
    });

    const parsed = safeParseTemplateJson(input);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.payload.schemaVersion).toBe("1.0");
    expect(parsed.payload.items).toHaveLength(2);
    expect(parsed.payload.items[0]).toMatchObject({ title: "Routine A", starsReward: 3 });
  });

  it("returns parse error for payload without schemaVersion", () => {
    const parsed = safeParseTemplateJson(JSON.stringify({ items: [] }));

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }

    expect(parsed.errorCode).toBe("MISSING_SCHEMA_VERSION");
  });

  it("builds selected payload by indexes and ignores invalid entries", () => {
    const payload = {
      schemaVersion: "1.0",
      items: [{ id: "a" }, { id: "b" }, { id: "c" }],
    };

    const selected = buildSelectedTemplatePayload(payload, [2, 1, 1, -1, 50]);

    expect(selected.schemaVersion).toBe("1.0");
    expect(selected.items).toEqual([{ id: "c" }, { id: "b" }]);
  });

  it("updates selection list when toggling values", () => {
    const step1 = buildNextSelection([], "item-1", true);
    const step2 = buildNextSelection(step1, "item-2", true);
    const step3 = buildNextSelection(step2, "item-1", false);
    const step4 = buildNextSelection(step3, "item-2", true);

    expect(step1).toEqual(["item-1"]);
    expect(step2).toEqual(["item-1", "item-2"]);
    expect(step3).toEqual(["item-2"]);
    expect(step4).toEqual(["item-2"]);
  });
});
