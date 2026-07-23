# Release History



### 0.1.3 ( 2026-07-23 )
- [x] Fix: `package.json`'s `repository`, `homepage`, and `bugs` fields, and the README's Changelog link, all pointed at `github.com/peter-naydenov/dim` — a path that 404s. The real repo is `github.com/PeterNaydenov/dim` (confirmed via `gh api`). The README link also used `blob/master/...`; the repo has no `master` ref at all, its default branch is `main`. Fixed both;
- [x] Fix: `npm run build` never cleaned `dist/` before writing to it (`vite.config.js` had `emptyOutDir: false`), so stale/renamed build artifacts could silently linger and ship in the published tarball. Set `emptyOutDir: true` and reordered `build` to run `build:js` (which now empties `dist/` before writing the bundles) before `build:types` (which only adds the declaration file into the now-clean directory). Verified: dropped stray files into `dist/`, including a fake `dim.d.ts`, and confirmed a full `npm run build` removes them;
- [x] Docs: documented that `code` (in `update`/`prepend`/`append`) is parsed as HTML via a `<template>` element and inserted live into the DOM — untrusted/user-supplied input must be sanitized first. Added the warning to the `RangeMutator` JSDoc typedef and to the README's "Replace the content" section; previously undocumented;



### 0.1.2 ( 2026-07-23 )
- [x] Build: switched `.d.ts` generation from `vite-plugin-dts` to `tsc` directly. Removed the `vite-plugin-dts` dependency and the unused `vite.config.mjs`; `vite.config.js` now only bundles `es`/`cjs`/`umd`. `tsconfig.json` now has `checkJs: true` and `noEmitOnError: true` so type errors in the JSDoc fail the build instead of being silently ignored. Added `build:types` / `build:js` / `typecheck` / `prepublishOnly` npm scripts (`build` runs both steps; `prepublishOnly` runs typecheck + tests + build before every publish);
- [x] Build: `tsc` emits the declaration file as `dist/main.d.ts` (named after the source entry, `src/main.js`) instead of `dist/dim.d.ts`. `package.json`'s `types` and `exports["."].types` now point at `dist/main.d.ts`;
- [x] Package: added `description`, `keywords`, `homepage`, `bugs`, `sideEffects: false`, `engines.node >= 18`, and an explicit `files` whitelist (`dist`, `src`, `README.md`, `Changelog.md`, `LICENSE`, `tsconfig.json`) for npm publishing;
- [x] Types: fixed `RangeApi.delete`, which was incorrectly typed as `RangeMutator` (`(code: string, keepCache?: string) => void`) even though the implementation only ever took a single `keepCache` argument — a TypeScript consumer following the old type could easily pass `'cache'` in the wrong argument slot and silently lose the undo. Now typed as `(keepCache?: string) => void`;
- [x] Types: added descriptions to every `RangeApi`/`DimApi` `@property` line in the JSDoc typedefs. Previously only `update` and `back` carried a doc comment into the generated `dist/main.d.ts`; `clearCache`, `getContext`, `isEmpty`, `delete`, `prepend`, `append`, `set`, and `get` had no editor tooltip at all despite having full JSDoc (with examples) on their actual implementations. Also added `@throws {TypeError}` to `set()` and clarified that `SetCallback`'s markers must be attached to the DOM (or range creation throws), and that `reset()` only clears internal bookkeeping, not DOM markers already inserted;
- [x] Demo (`index.html`): replaced the old `demo.js` + `style.css` pair with a single self-contained counter demo. Fixed a bug where the invisible markers were placed around the *entire* `.counter` container (button included) instead of just the `#count` span, so the first `+1` click deleted the button along with the counter — `range.update()` was working exactly as documented, the demo just anchored the markers in the wrong place. Implemented the `U` (shift) "undo everything" behavior described in the demo's own hint text but never wired up. Fixed a counter-drift bug where, after undoing all the way back to `0`, the next `+1` continued from the last high value instead of restarting at `1` (the click counter and the undo-cache depth were tracked as two separate variables that could fall out of sync);
- [x] Cleanup: removed the unused `demo.js`, `style.css`, and `javascript.svg`; updated `.gitignore` to also cover `*.log`, `*.tsbuildinfo`, `.env*`, `.vscode`, `.idea`, `*.swp`;



### 0.1.1 ( 2026-07-23 )
- [x] Fix: range API operations were silently shrinking the effective range over time. The `makeMyAPI` range object was created once in `set()` and reused across every operation without ever being reset. Per the DOM Range spec, `insertNode` moves the range's end position to *after* the inserted content and `deleteContents` collapses the range — so after the first `update`/`delete`/`back`, the range no longer covered `[after start, before end]`, and each subsequent operation worked on a smaller and smaller area. The orphan-detection feature (`validate()` checking `start.isConnected`) could never fire because the drift meant child markers placed *between* the start and end were never actually deleted by `range.deleteContents()`. Added a `refreshRange()` helper that re-anchors the range via `setStartAfter` / `setEndBefore` before every modifying operation (`update`, `delete`, `back`, `isEmpty` — `prepend`/`append` use `start.after` / `end.before` and don't need it). Confirmed via probe: with child markers placed between parent markers, `parentRange.update('')` now correctly removes them and `validate()` logs the warning. Previously the child markers were silently still in the DOM after the parent's update;
- [x] Fix: `get()` crashed with `Cannot read properties of undefined (reading 'includes')` (or `name.includes is not a function`) on `undefined` / `null` / non-string / number / object input — the JSDoc says `string|string[]` but a user passing the wrong type got a raw JS error instead of a clean `undefined`. Added a type guard that returns `undefined` for any non-string non-array argument, so the call is harmless instead of crashing the consumer;
- [x] Fix: `set()` threw the generic `fn is not a function` when called with anything other than a function as the first argument. Now throws a clear `TypeError: set() requires a function as the first argument` before any work is done (no TextNodes created, no partial state);
- [x] Tests: 3 BUG 1 regression cases (orphan works after the parent's update, repeated updates don't shrink the effective range, `isEmpty()` reports the live state), 2 BUG 2 regression cases (invalid input returns `undefined`, empty array returns `[]`), 1 BUG 3 regression case (TypeError with a clear message). 30 → 36 passing tests;
- [x] Tests: rewrote the existing "isEmpty() should return true when child range is orphaned" — the original setup appended child markers to the parent container *after* `parentEnd`, so they were never inside the parent's range, and the "orphan" check never fired. The rewritten setup places child markers *between* `parentStart` and `parentEnd` so the parent's `update('')` actually deletes them, and the test now exercises the real orphan path (the `console.warn` warning inside `validate()` is what was previously uncovered);
- [x] Docs: README rewrite;


### 0.1.0 ( 2025-04-24 )
- [x] Orphan range detection in case of nested ranges;
- [x] All range operations (update, delete, prepend, append, back, isEmpty, getContext) now validate before executing;



### 0.0.3 ( 2025-04-22 )
- [x] Extended testing;
- [x] Types building;



### 0.0.1 ( 2025-08-29 )
- [x] Documentation added;
- [x] Testing library is prepared. Not tested yet;



### 0.0.0 ( 2025-08-27 )
- [x] Very initial release - experimental;