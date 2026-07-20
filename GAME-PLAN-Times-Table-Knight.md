# Times Table Knight — Game Design & Implementation Plan

> **Status:** Implemented (2026-07) on `feature/GH-97-Knights-multiplication-game` — all build-order rows A–L (§12) are committed. Now in the playtest-and-tune phase that §12a predicted; defects found in real play are logged in [GAME-BUGS-Times-Table-Knight.md](GAME-BUGS-Times-Table-Knight.md), and post-launch design decisions continue in §15 (items 15+).
> **Working title:** _Times Table Knight_ (a.k.a. "Knight's Multiplication Quest"). Rename freely.
> **Type:** Arcade math platformer — an independent feature module at `src/features/times-table-knight/`, designed from clean-architecture principles (§8), not modeled on any existing game.
> **Theme:** Medieval. Hero is a **knight** — the child picks **Dame (lady knight)** or **Sir (man knight)** at setup.

---

## 0. The game in simple words

*A plain-English summary of the whole game (easy to read for English learners). The precise design starts at §1.*

### Adventure mode — how one stage works

1. **You run and jump** through the world. Watch out: animals hurt you if they touch you, and holes in the ground are dangerous. If you get hurt, you lose one heart ❤️.
2. **You find an anvil ⚒️ or a scroll 📜 on the road.** When you step on it, the game stops. Nothing can hurt you now. You see a math question, for example 7 × 8. You have as much time as you need.
   - **Right answer:** your equipment gets better. The anvil gives you a better weapon. The scroll gives you better armor.
   - **Wrong answer:** your equipment gets one step worse. But you never lose a heart for a wrong answer.
3. **You fight animals with your weapon.** A better weapon wins faster. Better armor protects your hearts.
4. **At the end of the stage, you meet the boss.** You fight him with the weapon you made with math. Sometimes a scroll falls down during the fight — touch it, answer one question, and your weapon gets better right away.
5. **You win the fight → you get stars ⭐ and the next stage opens.** If you lose all hearts, no problem — you can try the stage again.

**The main idea:** good math makes a strong knight. Jumping mistakes cost hearts. Math mistakes cost equipment. The two never mix — math can never kill you.

### Practice mode — the calm version

Nothing can hurt you here. An animal stands on the road and shows you a math question. Right answer: the animal goes away, you get coins. Wrong answer: you lose one heart, and the game shows you the correct answer so you can learn it. At the end, you answer questions to beat a small boss. Then you see your results: how many answers were right, your stars, and your coins.

---

## 1. Concept

A Mario-style side-scrolling platformer where a knight runs, jumps, and fights through medieval stages of creepy creatures, pits, and bosses. In the main mode the platforming is **real** — creatures and pits genuinely hurt, and fights are fought with real weapons. **Math is the power system**: the knight forges weapons and armor by solving multiplication problems from the times table the child is training. Strong math makes a strong knight; weak math means facing the boss with the starting dagger.

Guiding principle — **the world freezes for math**: the moment a multiplication problem appears (at a forge, a scroll, or a Practice encounter), the game **freezes completely** — no movement, no creatures, no danger. The child answers with **unlimited time**; a math outcome is decided by knowledge alone, never by reflexes or reading speed.

**Decided (2026-07-12): there is no timer anywhere in the game** — no session length, no stage deadline, no countdowns. Like Mario, play ends only when a stage is cleared, hearts run out, the whole game is completed, or the child chooses to stop.

**Decided (2026-07-12, mechanics rethink): the two-axis consequence model.** Reflex mistakes (creature contact, pits, boss attacks) cost **hearts**; math mistakes cost **equipment tiers** — never hearts. The axes never cross: math can never kill the knight, and no amount of jumping skill can forge a sword.

---

## 2. Player-chosen settings (setup screen)

| Setting | Range / Options | Notes |
|---|---|---|
| **Mode** | Practice Run · Adventure Quest | See §3. Both ship in v1. |
| **Level** | 1–15 | Level *N* = the **×N times table**. Level 15 = ×15. Picked here in Practice; in Adventure the stage is picked on the **world map** (only unlocked stages). |
| **Hero** | Dame (lady knight) · Sir (man knight) | Cosmetic; armor-color skins unlock via coins. |
| **Answer format** | Multiple choice (default) · Typed | Typed is an opt-in for advanced kids; auto-suggested at levels 11–15. |
| **Effects** | Sound on/off · Haptics on/off · Reduced motion | Standard effects toggles; also respects OS `prefers-reduced-motion`. |

### Problem-density tier ("1 in a row vs 3 in a row")

| Levels | Problems per question stop* | Practice mini-boss hits | Default format |
|---|---|---|---|
| 1–5 | 1 | 3 | Multiple choice (4 options) |
| 6–10 | 2 in a row | 4 | Multiple choice (wider spread) |
| 11–15 | 3 in a row | 5 | Multiple choice, typed offered |

\* A "question stop" = a forge anvil or enchanted scroll (Adventure) or a creature encounter (Practice). The Adventure boss is fought in real time — his HP is measured in weapon-damage points (§14), not answer-hits.

---

## 3. The two modes (both shipped in v1)

### Mode 1 — Practice Run (calm mode)
- Child picks **one table**; the run is a **finite "clear the table" stage** — no duration setting.
- **Nothing can hurt the knight here** — no pits, no contact damage, no real combat. Creatures pose problems; the strike is a celebration animation. Deliberately unchanged by the 2026-07-12 mechanics rethink: the gentle counterpart to Adventure.
- The stage covers **every fact of the table exactly once** (fact-range ladder, §15.20: ×1..×10 for tables 1–9, ×1..×12 for 10–12, ×1..×N for 13–15), grouped into creatures by density tier (§2): tables 1–5 → **10 creatures × 1 problem**, 6–9 → **5 creatures × 2**, 10 → **6 × 2**, 11–12 → **4 creatures × 3**, 13–15 → **5 creatures × 3** (the last volley runs short on tables 13–14) — then a **mini-boss finale** (HP per §2 boss-hits tier). Facts answered wrong are **re-asked once** before the mini-boss.
- The run ends when the mini-boss is defeated (stage cleared — the whole table has been covered) or hearts run out → results card (accuracy, facts mastered, best streak, coins, stars).
- Purpose: **focused, blocked drilling** of one table.

### Mode 2 — Adventure Quest (the main mode — a real Mario-style platformer)
- Start at Level 1; **defeat a stage's boss to unlock the next level**. A **world map** shows locked/unlocked stages, each with 0–3 stars.
- **Real danger:** creatures patrol and hurt on contact, pits swallow the careless — reflexes and platforming skill matter here (and only here; never while a question is open).
- **Math is the power system:** **forge anvils** (weapon ladder) and **enchanted scrolls** (armor ladder) stand along the stage. Stepping up to one freezes the world and poses problems (density per §2); correct → that ladder **+1 tier**, wrong → that ladder **−1 tier** + fact to the trouble pool. **Math never costs hearts.**
- **Real combat:** the knight attacks with the equipped weapon (attack button); creatures are slain by strikes (coins + score), not by answers. The **boss is fought in real time** with the forged weapon — his attacks are dodgeable, his HP falls to weapon damage, and mid-fight **scrolls drop** that freeze the world for a problem (correct = upgrade/recharge on the spot). With only the starting dagger the boss is a long, brutal fight — forging is the smart path.
- Each stage's question pool is **weighted**: mostly the current table + **interleaved review of earlier tables** + a personalized **trouble-facts pool** (spaced repetition; see §7).
- **No stage deadline.** The stage ends in exactly two ways: **boss defeated** → stars banked (accuracy + hearts remaining); **hearts depleted** → friendly retry. A mid-stage **checkpoint** preserves respawn point and equipment. **Never a hard "Game Over."**
- Beating **Level 15's boss completes the game** — grand finale celebration (Mario-style castle clear), world map shows all stars.
- Purpose: **progression + interleaved practice**, wrapped in a game that is genuinely fun as a game.

> Blocked practice (Mode 1) builds initial fluency; interleaved practice (Mode 2) builds durable retention. Offering both — and letting the child choose — also serves the autonomy driver of intrinsic motivation.

---

## 4. Core gameplay loops

### Adventure Quest loop (main mode)

```
Run / jump / fight through the stage
      │
      ├─ creature contact ─► −1 heart (armor absorbs first), brief knockback
      ├─ pit fall ─► −1 heart, respawn at last checkpoint
      ├─ weapon strike ─► creature slain → coins + score (streak multiplier)
      │
      ▼
⚒️ Forge anvil (weapon) / 📜 Enchanted scroll (armor)
      ── GAME FREEZES: world stops, unlimited time to answer ──
      ├─ correct ─► that ladder +1 tier, coins, streak up
      └─ wrong  ─► that ladder −1 tier, correct answer flashes,
                   fact → trouble pool   (hearts are never touched)
      │
      ▼
Boss arena ─► real-time fight: strike with the forged weapon, dodge his
              telegraphed attacks (reflex); dropped scrolls freeze the
              world for a problem — correct = upgrade/recharge on the spot
      │
      ▼
Boss defeated ─► celebration, 1–3 stars, next stage unlocks
```

### Practice Run loop (calm mode — no danger anywhere)

```
Wander (run / jump / collect coins — nothing can hurt the knight)
      │
      ▼
Encounter: a creature blocks the path with a floating equation
      ── GAME FREEZES: world stops, unlimited time to answer ──
      ├─ correct ─► knight strikes (animation), creature defeated, coins + combo
      └─ wrong  ─► creature bites (animation only): −1 heart,
                   correct answer flashes, fact → trouble pool
      │            (either way the creature retreats when the volley ends)
      ▼
Mini-boss ─► volley of problems, world frozen for each;
             correct = one hit, wrong = −1 heart + answer shown (no dodging)
      │
      ▼
Mini-boss defeated ─► results card, stars
```

### Movement & combat (Mario-like — NOT an auto-runner)
- Player-controlled **left / right + jump + attack** (attack exists in Adventure only).
  - Desktop: `←`/`→` or `A`/`D`; jump = `Space`/`↑`/`W`; attack = `F`/`Enter`.
  - Mobile: on-screen `◄` `►` + jump + attack buttons (all ≥ 44 px).
- Scrolling camera follows the knight; platforms, pits, coins, patrolling creatures, forge anvils, enchanted scrolls, a mid-stage checkpoint flag.
- Danger exists **only in Adventure and only between questions** — the moment any problem is on screen, the world is frozen (§1).

---

## 5. Rewards & penalties

### Equipment — forged by math (Adventure; decided 2026-07-12, supersedes "weapons are celebration")

Two ladders. **Anvils forge the weapon ladder; scrolls enchant the armor ladder.** A correct answer at a station raises that station's ladder one tier; a wrong answer lowers it one tier (never below base). Equipment is math mastery made visible — and it's what wins fights.

| Tier | ⚔️ Weapon (damage · reach) | 🛡️ Armor (protection) |
|---|---|---|
| 0 | 🗡️ Dagger — 1 dmg, short jab | Cloth — no protection |
| 1 | ⚔️ Sword — 2 dmg, wide arc | Leather — absorbs 1 hit |
| 2 | 🏹 Longbow — 3 dmg, ranged, pierces | Chainmail — absorbs 2 hits |
| 3 | ✨ Holy blade — 5 dmg, screen-wide smite | Plate — absorbs 3 hits |

Absorbed armor hits regenerate at the checkpoint and at the boss gate. Streaks still drive a **score multiplier** (×1 / ×1.5 / ×2 / ×3) and coin bonuses. Power-up collectibles: 🐎 swift steed (speed boost), 🧲 coin magnet. Coins → cosmetic unlocks (armor skins, helm plumes) — meta-reward.

In **Practice**, weapons remain pure celebration: the streak picks the strike *animation* (dagger → sword → bow → holy bolt); no real combat exists there.

### Penalties — the two-axis model (decided 2026-07-12)

| Axis | What hurts | What it costs |
|---|---|---|
| **Reflexes** (Adventure only) | creature contact, pit fall, boss attack | **−1 heart** (armor absorbs first); 0 hearts → friendly stage retry |
| **Math** (both modes) | wrong answer | **Adventure:** that ladder −1 tier — hearts untouched. **Practice:** −1 heart (nothing else can hurt there) |

- The axes never cross: **math can never kill the knight; reflexes can never touch a math outcome.**
- **Correct answer is always shown ~1 s** (corrective feedback); missed fact → **trouble pool**, resurfaces sooner.
- Pit/contact deaths respawn at the **checkpoint with equipment intact**; only 0 hearts restarts the stage (hearts refill, equipment resets to base) → instant, friendly retry. **Never a hard "Game Over."**

### Boss (Adventure — real-time fight with real weapons)
- Fought **with the forged weapon**: strike to deal tier damage against a segmented HP bar (§14); **dodge his telegraphed attacks** — getting hit costs 1 heart (armor absorbs first).
- **Scrolls drop during the fight** (~every 2 attack cycles): touching one **freezes the world** for a problem — correct = weapon/armor +1 tier (capped) and armor absorption refilled; wrong = −1 tier, answer shown, fact → trouble pool. Math stays present in the climax — preparation (forging) plus mid-fight scrolls decide how hard the fight is, reflexes execute it.
- Defeat → celebration (lightweight canvas glow/confetti), **1–3 stars** by accuracy + hearts remaining, next stage unlocks.
- The **Practice mini-boss** keeps the calm volley mechanic (§4): correct = one hit, wrong = −1 heart, no dodging — a math outcome is decided by knowledge alone.

---

## 6. Educational-design guardrails (baked into the build)
1. **Freeze-for-math** — every question (forge, scroll, Practice encounter) freezes the world; answering is always calm, frozen, and deadline-free, no matter how hectic the platforming around it.
2. **Adaptive difficulty / ZPD** — weighted selection surfaces weak facts; MCQ→typed scaffolding fades with level.
3. **Spaced repetition** — Leitner trouble pool re-tests missed facts at growing intervals.
4. **Immediate multi-channel feedback** — right/wrong via color **and** icon **and** sound (colorblind-safe); correct answer always shown.
5. **Low-stakes, recoverable failure** — hearts, armor, mid-stage checkpoint, instant retries, no dead-ends, no shaming.
6. **Layered rewards** — instant (weapon/combo) · session (stars/score) · meta (coin cosmetics).
7. **Self-Determination Theory** — autonomy (mode/level/hero/skin), competence (visible mastery), relatedness (a hero + world to care about).
8. **Meaningful distractors** — options mirror real errors: `a×(b±1)`, `a+b`, digit swaps — never pure random.
9. **No deadlines, no timers, ever** — there is no clock anywhere in the game. While a question is open the world is frozen; each child takes exactly as long as they need, and a session lasts as long as the child wants — bounded only by hearts and content, like Mario. Slow reflexes or slow reading can never fail a math question — only the answer itself counts.
10. **Two-axis consequences** — reflex mistakes cost hearts, math mistakes cost equipment tiers; the axes never cross. Struggling at math makes the knight weaker, never dead; struggling at platforming never erases math progress (equipment survives checkpoint respawns).

---

## 7. Math domain model

### Fact pool per session
- **Practice:** all facts `b × N`, single table `N` — `b ∈ [1..10]` for tables 1–9, `[1..12]` for tables 10–12, `[1..N]` for tables 13–15 (§15.20).
- **Adventure stage N:** weighted blend —
  - ~60% current table `N`,
  - ~25% interleaved review from tables `1..N-1`,
  - ~15% trouble-pool facts (any previously-missed fact), boosted by Leitner box.
- **Selection:** weighted random; each fact carries a weight = `baseWeight × leitnerBoost(fact)`. A correct answer promotes the fact one Leitner box (lower future weight); a wrong answer demotes it to box 0 (high weight, resurfaces soon).
- **Serving:** Practice serves facts at creature encounters; Adventure serves them at forge anvils, enchanted scrolls, and boss-fight scroll drops — the density tier (§2) sets problems per stop in both modes.

### Distractor generation (extends `multiplication-trainer/lib/quiz-options.ts`)
For correct answer `c = a×b`, generate 3 distractors preferring, in order:
1. `a×(b+1)`, `a×(b-1)` (off-by-one multiple),
2. `a+b` (operation confusion),
3. digit-swap / ±10 near-misses,
falling back to the existing random-delta logic. All distractors ≥ 1, unique, shuffled.

---

## 8. Module architecture

Independent feature module at `src/features/times-table-knight/`. The design is derived from clean-code / clean-architecture principles — it does not model itself on any existing game:

- **Feature isolation** — everything lives inside the module; only the Page is exported via `index.ts`.
- **Functional core, imperative shell** — all domain logic (`lib/`, `model/`) is pure, React-free, and unit-tested; rendering and I/O sit at the edges.
- **React-free engine** — `game/` contains no React imports; it communicates outward only through a typed event contract (`game/events.ts`, see §10).
- **Explicit state machine** — one reducer owns the session lifecycle (§10); no scattered boolean flags.
- **Side effects behind seams** — persistence, analytics, and capability gating are thin adapters in `services/`.
- **No magic numbers** — every tuning value lives in `game.constants.ts`.

```
src/features/times-table-knight/
├── index.ts                              # public exports (Page)
├── routes/
│   └── TimesTableKnightPage.tsx          # route entry, wires shell + controller
│
├── components/
│   ├── TimesTableKnightShell.tsx         # orchestrates setup ↔ play ↔ results
│   ├── Setup/
│   │   ├── SetupScreen.tsx               # mode/level/hero/format/effects
│   │   ├── ModeCard.tsx                  # Practice vs Adventure toggle
│   │   ├── LevelPicker.tsx               # 1–15 grid (Practice); Adventure picks stages on WorldMap
│   │   ├── HeroPicker.tsx                # Dame / Sir + skin preview
│   │   └── SessionOptionsCard.tsx        # format, effects toggles
│   ├── Play/
│   │   ├── GameCanvas.tsx                # <canvas> + game loop mount (see game/)
│   │   ├── Hud.tsx                       # hearts, armor, weapon, score, combo, stage progress
│   │   ├── EncounterPanel.tsx            # question surface for forge/scroll/encounter + answer input
│   │   ├── QuizOptions.tsx               # MCQ pad (reuse trainer pattern)
│   │   ├── AnswerInput.tsx               # typed input (reuse trainer pattern)
│   │   └── BossBar.tsx                   # segmented boss health
│   ├── Results/
│   │   ├── ResultsCard.tsx               # accuracy, facts mastered, stars
│   │   ├── FactBreakdownTable.tsx        # per-fact correct/wrong (reuse HistoryTable pattern)
│   │   └── StarsBanner.tsx               # 1–3 star celebration
│   ├── WorldMap/
│   │   └── WorldMap.tsx                  # Adventure stage select (locked/unlocked/stars)
│   └── TrainerSettingsMenu.tsx           # in-game pause/settings (reuse pattern)
│
├── game/                                 # canvas engine — pure TypeScript, no React imports
│   ├── engine.ts                         # fixed-timestep loop, dt clamp, gameRef state
│   ├── events.ts                         # typed GameEvents contract (engine → controller, §10)
│   ├── physics.ts                        # gravity, jump, AABB collision
│   ├── combat.ts                         # weapon strikes, damage, knockback, boss attack patterns
│   ├── entities.ts                       # Knight, Creature, Boss, Coin, PowerUp, ForgeStation, Scroll, Projectile
│   ├── spawner.ts                        # creature/coin/powerup/anvil/scroll placement by level & density
│   ├── camera.ts                         # side-scroll follow
│   ├── input.ts                          # keyboard + touch controls
│   ├── render.ts                         # draw routines (knight, creatures, boss, world, celebration)
│   └── worlds.ts                         # 15 world themes: palette + creature roster + boss per level (§15.15)
│
├── hooks/
│   ├── useTimesTableKnightController.ts  # top orchestrator: subscribes to GameEvents, dispatches reducer actions
│   ├── useGameAudio.ts                   # WebAudio blips (React hook — deliberately outside game/)
│   ├── useResponsiveCanvas.ts            # ResizeObserver + DPR sizing (React hook — deliberately outside game/)
│   ├── useCapabilityAccess.ts            # REUSE pattern
│   └── useTrainerAnalytics.ts            # REUSE pattern
│
├── lib/
│   ├── fact-pool.ts                      # build/weight fact pools (§7)
│   ├── leitner.ts                        # spaced-repetition boxes
│   ├── distractors.ts                    # pedagogical distractors (extends quiz-options)
│   ├── random.ts                         # REUSE from trainer
│   └── scoring.ts                        # points, combo, star calc
│
├── model/
│   ├── game.types.ts                     # all TS types (see §9)
│   ├── game.constants.ts                 # tiers, hearts, boss HP, weights, stage lengths
│   ├── game.reducer.ts                   # session state machine (see §10)
│   └── game.selectors.ts                 # derived state (accuracy, stars, mastery)
│
├── services/
│   ├── analytics/                        # events + types (reuse pattern)
│   ├── auth/trainer-capabilities.ts      # capability gating (reuse pattern)
│   └── progress/knight-progress.ts       # persist stars, best scores, trouble pool
│
├── slots/
│   ├── CapabilityGate.tsx                # REUSE pattern
│   ├── LoginSuggestionSlot.tsx           # REUSE pattern
│   └── UpgradeSuggestionSlot.tsx         # REUSE pattern
│
└── tests/
    ├── fact-pool.test.ts
    ├── leitner.test.ts
    ├── distractors.test.ts
    ├── scoring.test.ts
    ├── game.reducer.test.ts
    └── worlds.test.ts
```

**Reuse vs new**
- **Reuse patterns/code (from the trainer modules):** `random.ts`, capability slots + `useCapabilityAccess`, analytics service pattern, `QuizOptions`/`AnswerInput`/`HistoryTable`/`StatsBar` UI patterns, effects toggles.
- **Net-new:** the entire `game/` engine (fixed-timestep loop, physics/AABB, knight movement + camera, real-time combat, creatures/boss, forge stations, responsive canvas, WebAudio, celebration rendering), fact-pool weighting, Leitner, world map, star progression, pedagogical distractors.

**Shared-utility debt (noted 2026-07-12):** the reused utilities above already exist as per-feature copies across the trainer modules, and those copies have measurably diverged. The knight adds its own copies to keep this PR self-contained; extracting a shared library (`src/lib` / `src/components`) is logged as follow-up work — **refactoring existing modules MUST NOT be part of the knight implementation** (§15 item 10).

---

## 9. Core types (contract sketch)

```ts
// model/game.types.ts
export type GameMode = "practice" | "adventure";
export type AnswerFormat = "mcq" | "typed";
export type Hero = "dame" | "sir";

export interface GameConfig {
  mode: GameMode;
  level: number;          // 1..15
  hero: Hero;
  format: AnswerFormat;
  effects: { sound: boolean; haptics: boolean; reducedMotion: boolean };
}

export interface Fact { a: number; b: number; }            // a×b; a = stage table in Practice — Adventure also draws from earlier tables & trouble pool
export interface Problem { fact: Fact; answer: number; options: number[]; }

export interface Encounter {
  kind: "practice-creature" | "forge-anvil" | "armor-scroll" | "boss-scroll";
  problems: Problem[];    // 1..3 by density tier
  index: number;          // current problem in the volley
  results: (boolean | null)[];
}

export type WeaponTier = 0 | 1 | 2 | 3;   // dagger | sword | longbow | holy blade
export type ArmorTier  = 0 | 1 | 2 | 3;   // cloth | leather | chainmail | plate

export interface SessionState {
  phase: "setup" | "playing" | "encounter" | "boss" | "results";
  config: GameConfig;
  hearts: number;         // starts at 3; reflex damage only (Adventure) / wrong answers (Practice)
  score: number;
  coins: number;
  streak: number;         // drives score multiplier (and strike animation in Practice)
  weapon: WeaponTier;     // Adventure: real combat tier, forged at anvils
  armor: ArmorTier;       // Adventure: absorbs hits, enchanted at scrolls
  armorAbsorbLeft: number; // remaining absorbs; refilled at checkpoint & boss gate
  answered: number;
  correct: number;
  troublePool: LeitnerEntry[];
  stars: 0 | 1 | 2 | 3;
  questionStopsCleared: number; // stage progress toward the boss (no clock exists)
}

export interface LeitnerEntry { fact: Fact; box: number; dueAt: number; }

export interface StageProgress { level: number; unlocked: boolean; stars: 0 | 1 | 2 | 3; bestScore: number; }
```

---

## 10. Session state machine (`game.reducer.ts`)

**Phases:** `setup → playing → (encounter ↔ playing)* → boss (↔ encounter for scroll drops) → results → setup`

**Actions:**
- `START(config)` → seed `SessionState`, `phase: playing`. **No clock exists in the state machine** — a session ends only via `BOSS_DEFEATED` or `HEARTS_DEPLETED`.
- `ENCOUNTER_TRIGGERED(encounter)` → `phase: encounter` (frozen world). Fired by Practice creatures, forge anvils, armor scrolls, and boss-fight scroll drops; on volley done → back to the previous phase (`playing` or `boss`).
- `ANSWER(value)` → mark correct/wrong, then by `encounter.kind`:
  - **forge/scroll (Adventure):** correct → that ladder **+1 tier** (capped) + streak/score/coins; wrong → that ladder **−1 tier** (floor 0), show answer, `demote(fact)`. Hearts untouched.
  - **practice-creature:** correct → strike animation + streak/score/coins; wrong → `hearts−1`, show answer, `demote(fact)`. The creature retreats when the volley ends, win or lose; missed facts are re-queued once before `BOSS_REACHED`.
- `KNIGHT_HIT` (Adventure engine event: contact/pit/boss attack) → `armorAbsorbLeft−1`, else `hearts−1`; at 0 hearts → `HEARTS_DEPLETED`.
- `CHECKPOINT_REACHED` → persist respawn point, refill `armorAbsorbLeft`.
- `CREATURE_SLAIN` → score (streak multiplier) + coins.
- `HEARTS_DEPLETED` → `results` (stage failed → friendly retry offer).
- `BOSS_REACHED` → `phase: boss` (Adventure: real-time fight, armor refilled; Practice: calm volley), 
- `BOSS_DAMAGED(dmg)` → lower boss HP by weapon damage (the Practice mini-boss dispatches `BOSS_DAMAGED(1)` per correct answer).
- `BOSS_DEFEATED` → compute stars, persist progress, `phase: results`; on Adventure Level 15 → game-complete grand finale.
- `RESET` → `phase: setup`.

Keep the **fast-changing game-world state** (positions, velocities) in a mutable `gameRef` object to avoid per-frame React renders; keep **session/HUD state** in the reducer.

**Engine ↔ React contract:** the engine never imports React and never touches the reducer directly. It emits typed `GameEvents` (`onEncounterTriggered`, `onKnightHit`, `onCreatureSlain`, `onCheckpointReached`, `onCoinCollected`, `onBossReached`, `onBossDamaged`, …) defined in `game/events.ts`; `useTimesTableKnightController` subscribes, maps each event to a reducer action, and issues engine commands (`freeze`, `resume`, `resolveEncounter`, `applyEquipment`) in return. The two worlds sync only at these event boundaries — nothing syncs per-frame.

---

## 11. Integration points
- **Routing** (`src/App.tsx`): add `<Route path="/times-table-knight" element={<TimesTableKnightPage />} />` under `CommonLayout`.
- **Menu** (`src/pages/MenuPage.tsx` + Menu API): add an **ARCADE** menu item; register a Lucide icon (e.g. `Sword` or `Shield`) in `iconMap`.
- **i18n:** add a `timesTableKnight.*` namespace to `src/locales/{en,uk,ru}/translation.json` (all three locales are maintained repo-wide). No hard-coded strings.
- **Analytics:** events — `session_start`, `problem_answered` (fact, correct, mode, level, stop kind), `equipment_forged` (ladder, tier, direction), `checkpoint_reached`, `boss_defeated`, `stage_unlocked`, `session_end` (accuracy, stars).
- **Capabilities/subscription:** this is a **gated/premium feature** (decided 2026-07-09). Wrap the route/setup in the existing `CapabilityGate` + `trainer-capabilities` pattern; non-subscribers see the `UpgradeSuggestionSlot` / `LoginSuggestionSlot` flow, mirroring the other gated trainers.
- **Persistence:** `services/progress/knight-progress.ts` — stars, best scores, and trouble pool per profile via existing profile/settings services; `localStorage` fallback for guests.

---

## 12. Task breakdown → build order

**Decided (2026-07-09): built in one go, not as separate GH issues.** The whole game is implemented in a single continuous session on one branch (`feature/GH-97-Knights-multiplication-game`), with **one commit per row below, in A→L order**, so the history stays reviewable and bisectable even though it ships as a single PR. The table's dependency column is the commit sequencing.

| # | Issue | Depends on | Acceptance criteria |
|---|---|---|---|
| A | Scaffold module + route + menu + i18n namespace | — | Empty page routes and appears in ARCADE menu; setup screen shell renders in en/uk/ru. |
| B | Math domain: fact-pool + Leitner + distractors + tests | A | Unit tests: correct weighting per mode/level; distractors meaningful & unique; Leitner promote/demote. |
| C | Canvas engine: loop, physics, combat, responsive canvas, input, camera | A | Knight moves L/R + jumps + attacks on desktop & touch; 60 fps on mid-range phone; camera follows. |
| D | Session reducer + selectors + tests | B | State machine transitions covered by tests; **no clock exists in the state machine**; **two-axis invariant tested** — no action path lets a wrong answer touch hearts (Adventure) or reflex damage touch equipment. |
| E | Question-stop system: panel, MCQ/typed, forge/scroll ladders, feedback | C, D | Any question stop freezes the world (no deadline); Adventure: correct → ladder +1, wrong → ladder −1 + answer shown + trouble enqueue, hearts untouched; Practice: wrong → −1 heart; density tiers 1/2/3. |
| F | Creatures, real combat, coins, power-ups, checkpoint, spawner | C, E | Creatures patrol & hurt on contact (armor absorbs first); weapon strikes slay creatures (damage by tier); pit fall → −1 heart + checkpoint respawn with equipment intact; spawns scale by level/density. |
| G | Boss fights + stars + celebration | E, F | Adventure: real-time boss, dodgeable telegraphed attacks, weapon-tier damage, scroll drops freeze world for problems. Practice mini-boss: calm volley (correct = hit, wrong = −1 heart, no dodging). Stars by accuracy+hearts; celebration plays. |
| H | Practice mode end-to-end (clear-the-table stage, mini-boss finale, results) | E, F, G | Full run: all 12 facts exactly once (12×1 / 6×2 / 4×3 creatures by tier) + missed-fact re-asks + mini-boss; results card with accuracy/facts/streak/coins/stars. |
| I | Adventure mode: world map, stage unlock, progress persistence, game-complete finale | G, H | Beating a boss unlocks next; stars/best persist across sessions; retry on hearts depleted; Level 15 boss → grand finale. |
| J | Hero picker (Dame/Sir) + coin cosmetics | C, H | Both heroes selectable and rendered; at least one unlockable skin. |
| K | Analytics + capability gating | H | Events fire with correct payloads; route/setup gated as **premium** — non-subscribers get the upgrade/login suggestion flow like other gated trainers. |
| L | A11y + performance + effects toggles + QA pass | H, I | §13 checklist passes; `/verify` + `/run` on mobile & desktop. |

Milestone 1 (playable Practice): A–H. Milestone 2 (full v1): I–L.

### 12a. One-go implementation estimate

Honest scale, for the record:

- **Size:** ~30 files, ~5,000–7,000 lines including tests. Equivalent to **2–4 weeks of human developer work**; as a single continuous Claude Code session, **several hours of wall-clock time**, likely spanning context compaction (work continues across it).
- **High confidence — correct as delivered:** all pure logic (fact pools, Leitner, distractors, scoring, session reducer — unit-tested as built) and the standard React work (screens, routing, i18n en/uk/ru, persistence, gating — existing repo patterns).
- **Medium confidence — works, then needs tuning:** the platformer itself. Movement, collisions, real-time combat, and boss fights will function and run in the browser, but **game feel cannot be verified in one shot**: jump arc, creature speed and damage fairness, boss attack telegraphing, real-device 60 fps, and how touch controls feel under a child's thumbs. Every game gets some of these wrong on the first pass — the combat rework raises the tuning surface further.
- **Expected follow-up:** 1–2 tuning sessions after real play (constants live in `game.constants.ts` precisely so tuning touches one file), plus a real-kid playtest of a Practice run once Milestone 1 (A–H) is playable — adults are poor predictors of what children find fun.
- **Defaults in force unless overridden:** the §14 config values, fact range 1..12, shared trouble pool across modes, and the decisions logged in §15 (items 5–14).

---

## 13. Accessibility & performance checklist
- [ ] Large touch targets (≥ 44 px); on-screen movement + jump + attack controls on mobile.
- [ ] Feedback multi-channel: color **+** icon **+** sound (never color alone).
- [ ] Reduced-motion option dampens parallax/celebration.
- [ ] Sound & haptics toggles + OS `prefers-reduced-motion`.
- [ ] Pause anytime; **every question freezes the world** — no countdowns or timers anywhere in the game, no moving threats, nothing that penalizes slow readers or slow reflexes.
- [ ] Keyboard fully playable on desktop; canvas focusable; `aria-label`s on controls.
- [ ] 60 fps target on mid-range phone; `gameRef` mutable state (no per-frame React renders); HUD updates throttled.
- [ ] Minimal, aggregate analytics appropriate for children.

---

## 14. Config defaults (in force unless overridden — see §12a)
- Hearts: **3**. Density tiers: **1–5 / 6–10 / 11–15**. Practice mini-boss hits: **3 / 4 / 5**.
- Adventure boss: HP **6 / 8 / 10 damage points** by tier; weapon damage **1 / 2 / 3 / 5**; scroll drop ~every **2** attack cycles.
- Equipment: 2 ladders × 4 tiers (§5); armor absorbs **1 / 2 / 3** hits (tiers 1–3), refilled at checkpoint & boss gate; equipment resets to tier 0 on stage retry.
- Stage length: Practice = **every fact exactly once**, creatures = facts ÷ density-tier volley size (last volley may run short) **+ mini-boss**; Adventure = **~8 creatures, 3 anvils + 3 scrolls, 1 mid-stage checkpoint, boss**.
- Fact pool multiplier range (§15.20): **1..10 for tables 1–9, 1..12 for tables 10–12, 1..N for tables 13–15**. Adventure blend: **60 / 25 / 15**.
- Streak thresholds: **3 / 6 / 10**. Streak score multipliers: **×1 / ×1.5 / ×2 / ×3**.
- Star thresholds (both modes award stars): **3★ ≥ 90% acc & ≥2 hearts, 2★ ≥ 75%, 1★ = cleared**.
- Skin prices: **50 / 150 / 300** coins.

---

## 15. Open questions & decision log
1. ~~Is this a **gated/premium** feature (wrap in `CapabilityGate`) or free?~~ **Decided (2026-07-09): gated/premium** — see §11.
2. ~~Confirm **fact range** — `1..12` per table, or include `×0`/beyond?~~ **Decided (2026-07-19): see item 20** — the fact-range ladder: ×1..×10 below table 10, ×1..×12 for 10–12, ×1..×N for 13–15.
3. Star thresholds (§14) — accept proposed or adjust? *(Default in force: as listed in §14.)*
4. Should Practice mode also feed the **shared trouble pool** used by Adventure, or keep pools separate per mode? *(Default in force: shared.)*

Mechanics decisions from the 2026-07-12 consistency review (each choice shows the rejected alternative):

5. ~~Density tiers (2–3 problems per encounter) conflicted with Practice's "one creature per fact".~~ **Decided (2026-07-12): density divides the creatures.** Practice always covers all 12 facts exactly once: 12×1 / 6×2 / 4×3 creatures by tier — see §3. *(Rejected: repeating facts to keep 12 creatures at every tier — inflates the stage and breaks "each fact exactly once".)*
6. ~~Weapon effects ("pierces multiple creatures", "screen-clear") implied free-roam combat, contradicting §1's "every defeat is earned by math".~~ **Decided (2026-07-12): weapons are celebration, not combat.** **Superseded the same day by item 11** — in Adventure, weapons are now real combat equipment; the celebration-only ladder survives in Practice.
7. ~~Could pits or creature contact cost hearts?~~ **Decided (2026-07-12): no non-math damage.** **Superseded the same day by item 11** — Adventure now has real contact/pit damage; the no-danger rule survives in Practice.
8. ~~After a wrong answer, does the creature keep blocking the path? Does the fact count as covered?~~ **Decided (2026-07-12): the creature retreats when the volley ends, win or lose** (no grinding walls); the missed fact goes to the trouble pool and is re-asked once before the mini-boss. *(After item 11 this applies to Practice; Adventure question stops never block the path either.)*
9. ~~Practice penalty: hearts, or "may deduct coins instead"?~~ **Decided (2026-07-12): hearts in both modes**; the coin-deduction option is dropped — see §5.
10. ~~Extract the duplicated trainer utilities (`QuizOptions`, `AnswerInput`, capability slots, `random.ts`, `useCapabilityAccess`, …) into a shared library as part of this feature?~~ **Decided (2026-07-12): no — the knight ships with its own copies.** Extraction into `src/lib` / `src/components` is follow-up debt (the existing per-trainer copies have already diverged and need reconciling first). **Refactoring existing modules MUST NOT be part of the knight implementation.**

Mechanics rethink (2026-07-12, second round) — Adventure became a real Mario-style game:

11. **Adventure is a real platformer** — creatures, pits, and the boss genuinely hurt; combat uses real weapons; math is the power system (forging). Supersedes items 6 and 7 for Adventure; Practice keeps the calm mechanics. *(Rejected: keeping the all-frozen quiz-platformer as the main mode — it wasn't a real game, and kids notice.)*
12. **Math lives at forge anvils (weapon) and enchanted scrolls (armor), plus scroll drops during the boss fight** — see §4/§5. *(Rejected: stations only — the finale would contain zero math; questions dropped by slain creatures — interrupts combat rhythm.)*
13. **A wrong answer costs one equipment tier, never hearts** — the two-axis model (§1/§5/§6.10). *(Rejected: wrong answers also costing a heart — a struggling child could die of not knowing 7×8.)*
14. **Death model: 3 hearts + mid-stage checkpoint** — equipment survives respawn; 0 hearts = friendly stage retry with equipment reset. **Practice Run keeps its calm frozen mechanics unchanged.** *(Rejected: Mario-style armor-as-health power-down — entangles math with survival; one-hit death — too punishing for the age group.)*

Post-launch decisions from the first real playtests (2026-07-19; defect details in [GAME-BUGS-Times-Table-Knight.md](GAME-BUGS-Times-Table-Knight.md)):

15. **One distinct world per level.** The original three 5-level visual bands read as repetition ("levels 1, 4 and 5 are the same world"). `game/worlds.ts` now defines 15 themes — meadow, garden, forest, lake, farm, desert, beach, jungle, mountains, antarctica, city, building, cave, castle, volcano — each a pure-data entry (6-color palette + creature roster + boss); render/spawner look the theme up by level, and difficulty scaling stays world-agnostic. The three original palettes survive as levels 1, 6 and 14. *(Rejected: 5 bands of 3 levels — cheaper to curate, but the per-level "new world!" signal is stronger and each extra world costs only ~10 lines of data.)*
16. **Creature rule: real, area-native animals only.** Stage creatures are never ghosts, zombies, or monsters — and not the comical 🐺 head emoji; fantasy figures (troll, witch, zombie, golem, snowman, robot, dragon) are **boss-only** — bosses may also be big real animals (boar, bear, crocodile, gorilla…). Decided assignments: desert = camel + kit fox with snake boss; city = raccoon + sparrow with rat boss; building = cat + mouse. Behaviors stay predictable across worlds (walkers walk, flyers fly) so a child's reflexes transfer. Enforced by `tests/worlds.test.ts`.
17. **Level-geometry rule: open sky over every pit.** A platform above a gap is a head-bump trap — the jump apex (~131 px) always exceeds the clearance, knocking the knight into the chasm (bug #1). The "rescue platform" idea from §8's spawner is dead; brave-jump coins now trace the jump parabola over each gap.
18. **Practice path-block and its question trigger are both horizontal-only.** The creature's invisible wall clamps X at any height, so the volley trigger must fire on X-proximity too — an AABB-overlap trigger strands a knight arriving on a platform above the creature (bug #4).
19. **The Black Knight boss (levels 9 and 13 — replaces the mountain golem and the cave zombie).** Rendered as a scaled-up vector mirror of the hero — near-black plate, dark-red plume, glowing red visor — via the shared `drawKnightBody` routine, not an emoji; his world-map/boss-bar icon is ⚔️ (a knight's duel). Also: the speed power-up is a 🐎 swift steed, not sneakers — pickups stay medieval. *(Rejected: an emoji stand-in like 🤺 — the mirror-duel against "another knight" lands much stronger in the game's own art style.)*
20. **The fact-range ladder** (extended the same day): tables 1–9 drill **×1..×10** only — no 4×11 or 8×12; tables 10–12 keep **×1..×12** (10×11, 10×12 stay); tables 13–15 extend to **×1..×N** — 13×13, 14×14, and the full 15×15 at the finale. **The cap follows the fact's own table (its first factor), never the level being played** — interleaved review of table 3 during level 12 still stops at 3×10, while a review fact from table 10 may be 10×12. Matches school progression: the classic 1–10 grid first, extensions at the advanced levels. Applies everywhere facts are served — Practice ("every fact exactly once"; creatures = facts ÷ density volley, last volley may run short, e.g. table 13 → 3+3+3+3+1), Adventure current-table and review shares, and the trouble pool (stale stored facts beyond a table's cap are filtered on serving). Resolves open question 2. Enforced in `model/game.constants.ts` `factMaxFor(table)` + `lib/fact-pool.ts`; covered by `tests/fact-pool.test.ts`.
