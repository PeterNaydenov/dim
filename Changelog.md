# Release History



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