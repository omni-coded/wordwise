# WordWise — Find Words. Expand Your World.

An elegant word-search game for adults in which every level is a new puzzle and every completed puzzle leaves you knowing something you did not know before.

React 19 + TypeScript, no backend, no accounts. Progress lives in the browser (`localStorage`). Core play needs no internet connection (only the optional Google Fonts stylesheet does; the game falls back to system serif/sans fonts without it).

## What you get

| Area | What it does |
| --- | --- |
| **Endless campaign** | Procedurally generated, seeded, and *validated* puzzles. Level 1 is Medium (10 words on a 12×12 grid, plus a hidden bonus word). Difficulty scales by grid size, word count, word length, backward/diagonal frequency, vocabulary difficulty, look-alike letter sequences, and overlaps. Relaxing levels follow hard ones; every 10th level is a milestone, every 25th a gauntlet; some levels are clue puzzles that give meanings instead of words. |
| **Learn as you play** | Every word has a definition, an example sentence, a fact, a pronunciation, a difficulty rating, a topic, and a "why it matters" line. A card appears the moment you find a word; a Learning Summary follows each puzzle, then a 3–5 question **Fact Challenge**. |
| **Knowledge Journal** | Every discovered word, searchable and filterable (favorites, due, learning, familiar, mastered), with subject growth bars and an unscored quick quiz. |
| **Smart Review** | Leitner spaced repetition (1, 3, 7, 16, 35-day intervals). Right answers push a word out; wrong ones bring it back. Review puzzles can be built from due words. |
| **Daily Brain Challenge** | One puzzle per calendar date, identical for everyone (seed `wordwise|daily|YYYY-MM-DD`, built-in vocabulary only), a 5-question quiz, a score, and daily/weekly streaks. |
| **Themed Journeys** | Psychology, Money Mastery, Science Explorer, History Archive, Technology Frontier, Critical Thinking: eight stepping-stone puzzles each, then a mastery challenge (hard grid + 8 questions, pass at 70%). |
| **More modes** | Expert Challenges (bigger grid, generous optional clock), free Practice by subject/topic, Focus Mode, Word of the Day. |
| **Rewards** | XP, stars, coins, ranks, 63 achievement badges, category mastery titles, unlockable grid themes and highlight styles. **Nothing rewards speed**: XP comes from words, accuracy, discovery and learning. |
| **Accessibility** | Full keyboard play, screen-reader announcements, high-contrast and plain-font options, four text sizes, reduced motion, optional vibration, light/dark/system theme. |
| **Sound** | Synthesised with Web Audio (no audio files): soft pentatonic effects and an optional generative ambient pad. |

### Subjects

Twelve subjects ship, with 30 entries each (360 words). The original brief suggested fifteen; **three are not shipped yet** (politics & civics, art & architecture, everyday knowledge). Mature topics such as consent, boundaries, emotional intelligence, workplace communication, and financial literacy are covered by *Life Skills & Relationships*, *Personal Finance & Economics* and *Business*.

## Important: about the content

**All 360 built-in entries were AI-drafted and are marked `status: 'draft'`. None has been checked by a human editor.** They were written to be accurate and conservative, and the app labels each card as a draft, but you should have an editor verify them before presenting WordWise as an authoritative source.

- `npm run content:report` lists every category, its difficulty mix, how many entries are reviewed, and public reference works to check the entries against.
- Verified content is a first-class concept: an entry with `status: 'verified'` must carry `reviewedBy` and `sources`, and the card then shows it as verified instead of draft.
- Entries are validated automatically (hidden word matches the term, 4–15 letters, the example contains the term, the definition does not give the term away, length limits), but that checks *form*, not *truth*.

## Run it

Requirements: Node 20+.

```bash
npm install
npm run dev            # http://localhost:5173 with live rebuild
npm run build          # dist/ (index.html + assets/)
npm run build:single   # dist-single/index.html — one self-contained file
npm run build:artifact # dist-artifact/index.html — the same, as a body fragment for hosts that supply their own <html>/<head>
```

## Deploy

WordWise is a static site. Upload the contents of `dist/` (or the single `dist-single/index.html`) anywhere that serves files:

- **GitHub Pages / Netlify / Vercel / Cloudflare Pages:** set the build command to `npm run build` and the publish directory to `dist`. Paths are relative, so it works in a sub-folder.
- **Any web server or S3 bucket:** copy `dist/`. No server-side configuration or rewrites are needed (screens are addressed by `#ww-<screen>` hash links).
- **Offline / email / USB stick:** `npm run build:single` and open `dist-single/index.html` directly.

There is nothing to configure and no data leaves the browser.

## Architecture

```
src/
  engine/    Pure puzzle logic: seeded RNG, placement generator, independent solver/validator,
             difficulty model, word picker, selection geometry, play session. No UI, no storage.
  content/   Vocabulary as typed data: schema, validation, 12 category files, journeys,
             and the content-pack importer.
  game/      Pure SaveData → SaveData transitions: progression, rewards, streaks, spaced repetition,
             quizzes, daily, achievements, storage (versioned, sanitising), and selectors for the screens.
             audio.ts is the only file here that touches the browser.
  ui/        React: a context store (state.tsx) wires the pure functions to the clock, localStorage and
             the page; components/ and screens/ are presentational.
  styles/    Design tokens (navy / charcoal / ivory / muted gold), light and dark themes, grid themes.
tests/       Unit tests for everything above (node:test).
e2e/         An optional browser smoke test (Playwright).
examples/    A sample content pack.
```

Key guarantees:

- **Reproducible:** a puzzle is a pure function of its `PuzzleSpec` (seed, level, category, …). The same seed always gives the same grid.
- **Solvable and unambiguous:** every generated puzzle is checked by an independent solver that finds every word, finds each exactly once, and rejects accidental extra copies. The generator retries with relaxed settings until a puzzle passes.
- **Selection by position, not letters:** a word counts only when its exact start and end cells are selected, in either direction.
- **Safe saves:** saves are versioned, sanitised on load, backed up after every completed puzzle, and a corrupt or newer-format save is set aside rather than overwritten. An unfinished puzzle is re-validated on load and always resumes paused.

### How difficulty works

`paramsForLevel(level)` produces grid size (12×12 growing to 18×18 by about level 50), word count (10 growing to about 25), length window, backward/diagonal probability, vocabulary target, overlap preference, and decoy fragments (letter runs that look like the start of a word). The displayed label blends the planned score with a measurement of the finished puzzle (how many words run backward or diagonally, how much they overlap, how long they are, how hard the vocabulary is, how many decoys there are): Gentle < 30 ≤ Medium < 45 ≤ Medium-Hard < 58 ≤ Hard < 72 ≤ Expert < 86 ≤ Master. Level 1 reads Medium; level 100 reads Expert.

## Adding content

### A. Add to the built-in vocabulary

Each category file in `src/content/categories/` is a `CategoryDef`: topics with compact rows of
`[term, pronunciation, difficulty 1–5, definition, example, fact, why it matters]`. Add rows, then run `npm test` (the content tests validate every entry) and `npm run content:report`.

### B. Import a content pack (no code needed)

A pack is a JSON file; players can paste it into **Settings → Content packs**:

```json
{
  "format": "wordwise-pack",
  "version": 1,
  "category": { "id": "kitchen-craft", "name": "…", "shortName": "…", "blurb": "…", "glyph": "✶",
                 "references": ["…"], "topics": [ { "id": "heat", "name": "…", "connection": "…", "rows": [ ["Blanch", "blanch", 2, "…", "…", "…", "…"] ] } ] },
  "review": { "status": "verified", "reviewedBy": "Dr. A. Editor", "sources": ["Publisher, Title, year"] }
}
```

See `examples/sample-pack.json`. Rules: the category `id` must not collide with a built-in; a `verified` pack must name its reviewer and sources; every problem is reported in plain language. Packs are stored in the save and re-validated on every load. The Daily Challenge and Word of the Day always use built-in vocabulary only, so they stay identical for every player.

### Recommended verification workflow

1. `npm run content:report` to see what is unreviewed and the suggested references.
2. An editor checks each entry against those sources and corrects it.
3. Set `status: 'verified'`, `reviewedBy`, and `sources` on the entries (or `review` on a pack).
4. Run `npm test`.

## Tests

```bash
npm test               # 147 unit tests: placement engine, selection logic, puzzle validation, difficulty
                       # progression, content, quizzes, spaced repetition, streaks, rewards, saves, actions
npm run typecheck      # engine, content, game, tests
npm run typecheck:ui   # the UI, using types/react-shim.d.ts (delete it and use @types/react if installed)
npm run build && npm run e2e   # optional browser smoke test (needs: npm i -D playwright)
```

The unit tests include difficulty progression across levels, determinism of daily puzzles, solver agreement on hundreds of generated grids across levels 1–2000, and hostile/corrupt save handling.

## Known limitations

- Content is AI-drafted and unreviewed (see above).
- Twelve of the fifteen suggested subjects ship.
- Sound is synthesised and has been verified to run without errors but not tuned by ear across devices.
- Data lives in one browser: use **Settings → Export progress** to move it elsewhere. Export offers a file download and copy-to-clipboard; Import accepts a file or pasted text. The `build:artifact` build (for hosts that block file downloads) leaves out the download button and keeps copy-and-paste.
- Daily puzzles use each player's local calendar date, so players in different time zones can be on different dates for part of the day.

## License

Add the license you prefer. The word entries are original text written for this project.
