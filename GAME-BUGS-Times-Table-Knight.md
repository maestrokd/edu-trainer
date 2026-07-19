# Times Table Knight — Bug Log

> Companion to [GAME-PLAN-Times-Table-Knight.md](GAME-PLAN-Times-Table-Knight.md).
> Defects revealed by real playtesting (the plan's §12a predicted this: "game feel cannot be verified in one shot").
> One entry per defect: what was observed, the root cause, and the fix.

## Round 1 — first launch playtest (2026-07-19, Adventure Quest)

### 1. Coins over pits lured the knight into a head-bump death trap — FIXED

- **Observed:** collecting the coins over a chasm was impossible — every jump bumped the knight's head on the platform above, killing the jump mid-air and dropping the knight into the pit.
- **Verdict:** genuine level-geometry bug (the "rescue platform + brave-jump coins" combo from the plan was internally contradictory).
- **Root cause:** `game/spawner.ts` placed a platform spanning **every pit** at 120 px height with the coin arc underneath it. The jump rises ~131 px (`JUMP_VELOCITY² / 2·GRAVITY`), but the platform's underside sat only ~60 px above the knight's head — any jump for the coins hit the ceiling (`hitCeiling` zeroes `vel.y`) and dropped the knight into the gap. Crossing the pit was physically impossible.
- **Fix (`game/spawner.ts`):**
  - Removed the overhead platform — pits always sit under open sky (a ceiling above a gap can never be safe).
  - Narrowed pits to 76–104 px so a running jump (~159 px air range) clears them with margin.
  - Re-shaped the coin arc to trace the actual jump parabola — a well-timed brave jump sweeps all 5 coins.

### 2. Creatures and scrolls looked semi-transparent — NOT A CODE BUG, contrast improved

- **Observed:** bats and the scroll station appeared to render below 100% opacity.
- **Verdict:** no code draws them translucent — dimming exists only as deliberate feedback (used station → 45%, answered Practice creature → 40%). The washed-out look is the Windows Fluent emoji artwork (pale bat wings, beige parchment) blending into the pastel sky.
- **Fix (`game/render.ts`):** low-contrast threats are still a real readability problem for kids, so a soft drop shadow was added under creatures, stations, dropped scrolls, power-ups, the boss, and fireballs — they now read at full perceived opacity. Coins and particles were left alone (already high-contrast, and numerous enough that shadows would cost frame budget).

### 3. "Next stage" button dead — progress was never persisted at all — FIXED

- **Observed:** on the results card, "Next stage" did nothing, regardless of stars earned.
- **Verdict:** serious bug, wider than the button — **no session progress was ever saved** (stage unlocks, stars on the world map, coin wallet, trouble pool, session-end analytics).
- **Root cause:** in `hooks/useTimesTableKnightController.ts`, the session-banking block sat **below** an `if (!engine) return` guard. Entering the results phase unmounts `GameCanvas`, whose cleanup nulls the engine ref *before* the effect runs — so banking silently never executed. The next stage stayed locked, and `start()` refuses locked stages without feedback. The stars shown on the results card came from in-memory session state, masking the missing persistence.
- **Fix:** the results/banking block now runs first and independent of the engine (engine calls became optional `?.` calls). Next stage, star persistence, wallet, and analytics all work.
- **Playtest note:** victories from before the fix were never saved — stage 1 must be beaten once more (it sticks now).

## Round 2 — Practice mode playtest (2026-07-19, table ×8)

### 4. Knight stuck at an invisible wall when a platform stands over a creature — FIXED

- **Observed:** mid-stage, the knight simply stopped and could not walk further right (toward the next coins), with a spider on the ground below and no question appearing.
- **Verdict:** genuine bug — a mismatch between the two halves of the Practice "creature blocks the path" mechanic in `game/engine.ts`.
- **Root cause:** the path block is **horizontal-only** (`updateKnight` clamps the knight's max X to `creature.x − 30` for every unanswered creature, at any height), but the encounter trigger was a **full AABB overlap** (±14 px in *both* axes). A knight arriving on a floating platform above the creature hits the invisible X-wall while staying ~50–90 px above the creature — the overlap never happens, the volley never starts, the creature never retreats, and the wall never lifts. The Practice spawner routinely places platforms directly over creature posts (first platform spans x 340–450, first creature stands at ~420), so the trap was common.
- **Fix (`game/engine.ts`):** the trigger is now horizontal-only, mirroring the block — reaching the block point starts the volley whether the knight is on the ground or on a platform above the creature. (Escape was possible before by backtracking off the platform and approaching at ground level, but nothing communicated that; a child just sees a stuck knight.)
