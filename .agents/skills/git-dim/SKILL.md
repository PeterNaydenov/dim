---
name: git-dim
description: |
  Help developers use `@peter.naydenov/dim` (the DOM Invisible Markers
  library, v1.0.0): register ranges with `set`, look them up with
  `get` / `has` / `list` / `aliases`, replace content with `update` /
  `prepend` / `append` / `delete`, undo with `back`, and clean up with
  `reset`. Use when a developer asks for invisible DOM markers,
  range-based content replacement, in-place editing, hot-swap regions,
  or "undo for a specific DOM area". Do NOT use for: a virtual DOM
  diffing library (that's `@peter.naydenov/morph`), a full
  framework-agnostic UI library, or fixing bugs in `dim` itself.
---

# git-dim helper

`dim` creates two invisible `Text` markers (`start` and `end`) and gives
you a range API for the content between them. The markers stay in the
DOM tree but render as empty text, so the visible structure is
untouched. Replace, prepend, append, undo, query — all without leaving
a wrapper element or a string template behind.

Source of truth:
- `src/main.js` — the entire library; full JSDoc on every public method, plus the `RangeApi` / `DimApi` / `SetCallback` / `RangeMutator` typedefs
- `test/01-general.test.js` — registration, lookup, mutation, undo, reset, orphan detection, primitives, mixed HTML

## Procedure

1. **Map the developer's intent to the right shape of `dim()` call**:
   - "Insert content into a specific DOM area, replaceable later" → `d.set(({ start, end }) => { ... })` then `d.get('alias').update(...)`
   - "Replace the content of an existing region" → `d.get(...).update(htmlStringOrNode)`
   - "Add content to the start / end of a region without touching the existing content" → `d.get(...).prepend(...)` / `.append(...)`
   - "Make a region undoable" → `d.get(...).update(..., 'cache')` then `.back()` to restore
   - "Cut content from one region, paste it into another" → `.extract()` then the other region's `.update(fragment)`
   - "Read the current content of a region" → `.select()` for a fragment, `.toString()` for plain text
   - "Wipe everything and start over" → `d.reset()` (clears registry AND removes markers from the DOM)
   - "Tear down a single range" → `d.reset('alias')` or `d.reset(0)`

2. **Generate code that follows the real API contract**:
   - ESM import: `import dim from '@peter.naydenov/dim'` (CJS: `require('@peter.naydenov/dim')`)
   - Default export is a **factory function** — call it to get a `DimApi` instance: `const d = dim()`. Multiple `dim()` calls produce independent instances.
   - `d.set(fn, ...args)` — `fn` is the callback receiving `{ start, end }` plus any extra args. The callback **must attach both `start` and `end` to the DOM** before returning; `set` throws `Error('dim.set: callback must attach both "start" and "end" markers to the DOM')` otherwise. Throw is clean and checkable.
   - `fn` may return a string → that string becomes the alias for the range. The range is also reachable by its numeric index `'0'`, `'1'`, etc. (registration order, never reused).
   - `d.get(name)` accepts: a string alias, a numeric string like `'0'`, a number like `0`, a comma-separated string like `'a, b'`, or an array like `['a', 'b']`. Single-key returns a single `RangeApi`; multi-key returns an array. **Returns `undefined` (or `[]` for an empty array) for any non-string non-array non-number argument — never throws.**
   - `d.get(0)` and `d.get('0')` are equivalent. Aliases take precedence over numeric indexes (`d.get('0')` returns the range with alias `'0'` if one exists, else the first registered range).
   - `d.has(name)` mirrors `get`'s argument shape and returns `boolean`. Same defensive behavior (returns `false` on bad input).
   - `d.list()` returns all registry keys — aliases first (registration order), then numeric indexes. Deduped.
   - `d.aliases()` returns just the user-named aliases.
   - `d.reset(names?)` — no-arg clears everything AND removes every marker still attached to the DOM. With an arg (string/number/array/comma-separated), clears just those ranges (and their markers from the DOM, and both alias + numeric keys from the registry). Silent no-op on bad input.
   - `RangeApi` methods (`d.get(...).update(...)`, etc.) accept either an HTML **string or a DOM `Node`** (e.g. a `DocumentFragment`). A bad value throws `TypeError` *before* any mutation — the existing content is preserved.
   - Pass `'cache'` as the second arg to `update` / `delete` / `prepend` / `append` to snapshot the current range content for `back()`. Each cache snapshot is one undo step.

3. **Apply the order-of-execution rules**:
   - Within one range, key methods (in this order) all run a `validate()` check first: if either marker is `!isConnected`, log `console.warn('Warning: Current range is not available in the DOM at this time')` and **return without mutating** (mutators) or return a sentinel (`null` for `getContext` / `select` / `extract`; `true` for `isEmpty`; `''` for `toString`).
   - Use `isOrphan()` for a **silent** orphan check — same `isConnected` test, no `console.warn`.
   - `prepend` / `append` insert at the start-marker / end-marker position respectively. They do **not** change the existing range content. `prepend('<b>x</b>')` on a range containing "abc" yields "x" followed by "abc"; `append('<i>y</i>')` yields "abc" followed by "y".
   - `select()` returns a `DocumentFragment` (a clone, detached from the live DOM). Mutating the fragment is safe. Pair it with `update(fragment)` for a read → mutate → write round-trip.
   - `extract()` cuts the content out of the DOM and returns a fragment clone. The range is empty after. Pass `'cache'` to enable `back()` to restore.

4. **Surface only the relevant gotcha proactively** — pick at most one from the list below that applies to the current example, and only if the user is unlikely to know it:
   - **`reset()` removes markers from the DOM**, not just from the registry. If the user's code holds references to the markers after `reset()`, those references are detached. Use `reset('alias')` for surgical teardown.
   - **`update()` / `prepend()` / `append()` validate the `code` argument before mutating.** Bad input throws a `TypeError` and the existing content is preserved. Don't catch this error and try to "fix" the call — the library is telling you the call is wrong.
   - **`set()` requires the callback to attach both markers.** If the callback throws or returns before attaching them, `set` throws a clear `Error`. Don't try to register a range with detached markers.
   - **Orphan detection logs `console.warn` (not throws) and returns a sentinel.** It's intentional. If you need a silent check, use `isOrphan()`.
   - **Range drift across operations was fixed internally** — the range's start/end are re-anchored before each mutating call. Users don't have to do anything; this is just FYI for users coming from pre-1.0.0 where orphan detection was effectively broken.
   - **`get` / `has` / `reset` are silent no-ops on bad input** (return `undefined` / `false` / nothing). They never throw. This is intentional, but if the user expected an error for a typo'd alias, point them at `d.list()` to discover what exists.

5. **If the request is for a virtual DOM diffing / declarative UI library**, this is the wrong layer. `dim` is imperative — you call `.update(...)` yourself, it doesn't react to state. Point the user at `@peter.naydenov/morph` (template engine) or `@peter.naydenov/signals` (reactive state) for that.

6. **If the request is for a selection-based API** (read the user's current text selection, capture the browser's `getSelection()`), `dim` does not provide that. `dim` ranges are stored on the bus, not driven by the user's pointer. For browser selection, use the platform `window.getSelection()` directly.

## Output contract

- One focused code snippet, ESM by default (CJS if asked)
- One line of context explaining which methods are used and why
- A pointer to the relevant source/test section if the developer wants to dig deeper
- Surface at most one relevant gotcha proactively, only if it applies to the example
- Never include a code example that calls `set` with a callback that doesn't attach the markers (the library will throw a clear error, but the example would be misleading)
- Never include a code example that calls `update` with a non-string non-Node value (same reason)
- Never include a code example that catches the validation `TypeError` / `Error` and tries to recover silently (the library intends for these to surface)

## Failure handling

- The developer's use case genuinely ambiguous (e.g., "I want to put content in a div") → start with the basic `set` → `get` → `update` chain; mention `prepend`/`append`/`delete` for the "add to / clear" variants and `extract`/`select` for the "move content" use case
- Developer reports a bug or unexpected behavior in `dim` itself → do NOT try to fix from this skill; route to the project source or maintainer
- Developer wants a feature `dim` doesn't have (declarative binding to a state, auto-rerender on data change) → say so plainly, don't invent an API; point at `@peter.naydenov/signals` (for reactive state) or `@peter.naydenov/morph` (for template-driven rendering)

## Examples

**"Make a hot-swap region in the page"**

```js
import dim from '@peter.naydenov/dim'

const d = dim()

d.set(({ start, end }) => {
  const container = document.querySelector('#app')
  container.prepend(start)
  container.append(end)
  return 'app'   // alias
})

const app = d.get('app')                  // look up by alias
app.update('<h1>Loading…</h1>')
// … later, after data arrives:
app.update('<section><h1>Welcome</h1><p>…</p></section>')
```

`set` requires the callback to attach both markers. `get('app')` retrieves the alias. `update` accepts either an HTML string or a DOM `Node`; bad input throws a `TypeError` *before* any mutation. See `set` and `RangeApi.update` in `src/main.js`.

**"Cut a region's content and paste it into another"**

```js
import dim from '@peter.naydenov/dim'

const d = dim()
// … assume two ranges have been registered, e.g. `fromRegion` and `toRegion`
const from = d.get('fromRegion')
const to   = d.get('toRegion')

const moved = from.extract()    // cuts the content out, returns a DocumentFragment
// `from` is now empty; `moved` is detached, safe to mutate
to.update(moved)                // paste the fragment into `to`
```

`extract()` cuts and returns a fragment. The range is empty after. Pair with `update(fragment)` for the move. The fragment is a CLONE — node identity and `addEventListener` registrations don't carry over. See `RangeApi.extract` in `src/main.js`.

**"Undo the last update"**

```js
import dim from '@peter.naydenov/dim'

const d = dim()
// … assume a range is registered
const r = d.get('app')

r.update('Hello World 1')
r.update('Hello World 2', 'cache')   // snapshot "Hello World 1" before overwriting
r.back()                            // restore "Hello World 1"
```

Each call with `'cache'` pushes one snapshot onto the per-range undo stack. `back()` pops the most recent snapshot and writes it back into the range. `clearCache()` drops the whole stack. See `RangeApi.update`, `back`, `clearCache` in `src/main.js`.

**"Check what's registered / tear down one range"**

```js
import dim from '@peter.naydenov/dim'

const d = dim()
// … assume some ranges have been registered
d.list()         // → ['intro', 'sidebar', '0', '2']  (aliases first, then numeric, deduped)
d.aliases()      // → ['intro', 'sidebar']
d.has('intro')   // → true
d.has(['intro', 'sidebar'])   // → true only if BOTH exist

d.reset('intro') // remove the 'intro' range: drop from registry, remove its markers from the DOM
d.reset()        // nuke everything
```

`reset` without an arg clears the registry AND removes every marker still attached to the DOM. `reset('alias')` is surgical — same effect but for one range. `reset(null)` is a silent no-op (doesn't throw). See `DimApi.reset`, `list`, `aliases`, `has` in `src/main.js`.
