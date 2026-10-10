---
name: peter-naydenov-dim
description: |
  Build UI features on top of `@peter.naydenov/dim` — invisible DOM markers
  that define content ranges you can read, replace, undo, prepend, append,
  and clone. Load this skill when the user asks to add a "content slot",
  "hot-swap region", "A/B-test area", "undo-able editor zone", "loading…
  placeholder that gets replaced", or any feature built on dim's marker
  and Range API. Triggers on phrases like "use dim", "dim markers", "invisible
  marker", "DOM range slot", "@peter.naydenov/dim". Do NOT confuse with
  `@peter.naydenov/morph` (a string template engine — it renders templates
  + data into HTML strings and does not touch the DOM) — that is a different
  library by the same author with a different API surface. Also do NOT use
  for full-page rendering, server-side rendering, or any other DOM library.
---

# peter.naydenov/dim

A small DOM library. `dim()` returns an object that hands back two empty
`Text` nodes (`start`, `end`) per registered range. You place them in the
DOM yourself — they render as empty text, so they're invisible at runtime.
A `Range` between them is the unit you operate on: read, replace, undo,
prepend, append, clone, extract, clear.

Browser-only (uses `document.createRange`, `document.createTextNode`,
`Node.isConnected`). For tests use `jsdom` — the project's own test suite
runs on `vitest + jsdom`.


## Mental model — read this before writing code

- **The markers are yours to place.** `d.set(fn)` calls `fn({start, end}, ...args)`
  synchronously; the callback MUST attach BOTH `start` and `end` to the DOM
  before returning. Forgetting that throws
  `Error: dim.set: callback must attach both "start" and "end" markers to the DOM`.
  There is no auto-placement.
- **HTML strings are parsed as live HTML and inserted into the DOM.** The
  string form of `update` / `prepend` / `append` goes through
  `<template>.innerHTML` and lands in the live tree — this is an XSS vector.
  For untrusted input either sanitize first or build a `DocumentFragment`
  with `textContent` and pass the Node instead. See `references/pitfalls.md`.
- **The Range is auto-refreshed before every mutating op.** You don't see
  it but the library re-anchors `[start, end]` before each `update` /
  `delete` / `back` / `isEmpty`. Repeated `update` calls do NOT shrink the
  effective range (this was a real bug — fixed in 0.1.1).
- **`prepend` / `append` insert INSIDE the range** (immediately after
  `start` / before `end`), not outside the markers. They ADD — they don't
  replace. Existing range content stays in place.
- **`update` / `prepend` / `append` throw `TypeError` BEFORE any mutation
  on bad input** (`null`, `undefined`, number, boolean, object, array).
  Existing content + cache are preserved. This is intentional — previously
  these silently destroyed range content then threw an opaque browser error.
- **Orphan ranges silently no-op mutating methods.** If a parent range's
  `update` removes the markers of any child range placed between them, the
  child is "orphaned" — `update` / `delete` / `back` / `prepend` / `append`
  / `extract` log a single `console.warn` and do nothing, `select()` returns
  `null`, `isEmpty()` returns `true`, `toString()` returns `''`. Use
  `isOrphan()` in UI loops — it returns the boolean without warning.


## Procedure

### 1. Set up the instance and a range

```js
import dim from '@peter.naydenov/dim'
const d = dim()

// ONE-TIME per region — typically on page load or component mount.
d.set(({ start, end }, ...args) => {
  const host = document.querySelector('#feed')   // any existing node
  host.prepend(start)                            // marker at the front
  host.append(end)                               // marker at the back
  return 'feed'                                  // optional alias
}, /* forwarded to the callback as args */ 'en')
```

The string returned by the callback becomes the alias. Without an alias the
range is still reachable by numeric index (`d.get(0)`, `d.get('0')`).
Returning an alias that already exists OVERWRITES the old registration
(the previous range stays reachable by its numeric index). Avoid all-digit
aliases like `'0'` — alias lookup takes precedence over numeric indexes.

**Marker placement rule:** to make the entire interior of `host` the
range, use `host.prepend(start); host.append(end)`. Using
`host.append(start); host.append(end)` puts BOTH markers at the end of
the host, which leaves the original content outside the range — only
`update` calls that come *after* the markers will land inside the range,
and any pre-existing children of the host are not part of the range.

### 2. Write content (string OR Node)

```js
const r = d.get('feed')
r.update('<p>Hello <b>World</b></p>')        // HTML string → parsed live
r.update(someDocumentFragment)              // Node → no parsing
r.update(someElement)                       // any Node works
```

For a string, dim parses via `<template>.innerHTML` and inserts the result.
For a Node, dim inserts it directly with no parsing. Both forms are valid for
`update` / `prepend` / `append`. For the safer `select → mutate → update`
round-trip, see `references/api.md#select--update-round-trip`.

### 3. Use `'cache'` + `back()` for undo (it's a stack)

```js
r.update('first', 'cache')                  // snapshot current content
r.update('second')                          // current content is now 'second'
r.back()                                     // restores 'first', pops cache
```

`'cache'` is the second argument to `update` / `prepend` / `append` /
`delete` / `extract`. Each call pushes the pre-mutation content. `back()`
pops the most recent. `clearCache()` drops everything.

### 4. Clean up

```js
d.reset('feed')     // remove this range's markers AND registry entries (alias + numeric index)
d.reset()           // remove ALL ranges AND every DOM marker
d.reset(['a','b'])  // several at once
d.reset(0)          // by numeric index (number or '0' both work)
d.reset(null)       // silent no-op — never throws on bad input
```


## Output contract

When the task is "use dim for X", produce code that:

- Imports `dim` (ESM `import dim from '@peter.naydenov/dim'`; CJS
  `const dim = require('@peter.naydenov/dim')`; UMD `window.dim()` is the
  function itself as of v1.0.0)
- Calls `dim()` ONCE per scope (per page, per component instance)
- Calls `d.set(...)` for each region — the callback attaches both markers
  and returns an alias string when the range will be looked up by name
- Uses the public Range API (`update`, `select`, `extract`, `prepend`,
  `append`, `back`, `clearCache`, `isEmpty`, `isOrphan`, `toString`,
  `getContext`, `delete`) — never the internal `destroy` (non-enumerable,
  called only by `reset`)
- Sanitizes any user-supplied HTML before `update` (see
  `references/pitfalls.md`)
- Calls `d.reset()` on teardown when the lifetime of the markers is finite
  (route changes, component unmount, page navigation)


## Failure handling

- **XSS via `update('<user input>')`** — the string is parsed and inserted
  live. For user-supplied content either (a) sanitize first (DOMPurify,
  etc.) or (b) build a `DocumentFragment` with `createElement` /
  `textContent` and pass that. The Node form bypasses HTML parsing entirely.
- **`d.set(fn)` throws because `fn` did not attach the markers** — the
  callback MUST call `prepend` / `append` / `appendChild` / `before` /
  `after` on BOTH `start` and `end` before returning. Bare
  `document.createTextNode` is not enough — the markers must have a parent.
- **`r.update(null)` / `r.update(0)` / `r.update({})` throws `TypeError`**
  — this is the contract. Either guard the call site, or build a
  `DocumentFragment` from typed values before passing it.
- **Range is orphaned after a parent `update`** — the child range is
  silently disabled. Use `r.isOrphan()` to detect (no warning logged). If
  the slot is still mounted, re-create the range with `d.set(...)`.
- **Stale reference to a range** — if you call `d.reset('feed')` and then
  call methods on the previously-returned `range` object, the methods log a
  `console.warn` and return. Always re-fetch with `d.get('feed')` after a
  reset.
- **Wrong module system** — pre-1.0.0 builds returned
  `{ default: [Function] }` from `require`. v1.0.0+ returns the function
  directly. If a snippet has to support both, use a defensive destructure:
  `const dim = (typeof mod === 'function') ? mod : mod.default`.


## Quick API map

| Need                                       | Method                                   |
| ------------------------------------------ | ---------------------------------------- |
| Register a region                          | `d.set(fn, ...args)` → `void`            |
| Get a region by alias / index / list       | `d.get('feed')` / `d.get(0)` / `d.get(['a', 1])` |
| List every registered key                  | `d.list()` (aliases first, then numeric) |
| List only the user-named aliases           | `d.aliases()`                            |
| Existence check                            | `d.has('feed')` (array / comma form supported) |
| Replace content                            | `r.update(code, 'cache'?)`               |
| Read for safe mutation                     | `r.select()` → `DocumentFragment`        |
| Move content to another slot               | `r.extract('cache'?)` → `DocumentFragment` |
| Undo most recent change                    | `r.back()`                               |
| Drop all snapshots                         | `r.clearCache()`                         |
| Insert at start / end of region            | `r.prepend(code, 'cache'?)` / `r.append(...)` |
| Empty the region                           | `r.delete('cache'?)`                     |
| Inspect: container / empty / orphan / text | `r.getContext()` / `r.isEmpty()` / `r.isOrphan()` / `r.toString()` |
| Remove region(s)                           | `d.reset('feed')` / `d.reset(0)` / `d.reset(['a', 1])` / `d.reset()` |

For full signatures, edge cases, and the `select` round-trip pattern see
`references/api.md`. For XSS, orphan, and input-validation details see
`references/pitfalls.md`.


## Examples

### Example 1 — Hot-swap a content slot (the canonical use case)

```js
import dim from '@peter.naydenov/dim'
const d = dim()

d.set(({ start, end }) => {
  const host = document.querySelector('#feed')
  host.prepend(start)
  host.append(end)
  return 'feed'
})

const feed = d.get('feed')
feed.update('<p>Loading…</p>')

// Later, when data arrives:
feed.update(`<p>${escapeHtml(payload.title)}</p>`)  // sanitize user data!
```

### Example 2 — Read → mutate → write back (no `window.getSelection()`)

When you need to transform existing content (unwrap `<a>` tags, add a
class to every `<p>`, etc.) without touching sibling regions that share a
common parent:

```js
const r = d.get('feed')
const frag = r.select()                          // detached DocumentFragment
frag.querySelectorAll('a').forEach(a => {        // mutate freely
  const parent = a.parentNode
  while (a.firstChild) parent.insertBefore(a.firstChild, a)
  parent.removeChild(a)
})
r.update(frag)                                   // push back
```

This disambiguates sibling regions that `window.getSelection()` would
collapse into one. The fragment is detached — mutations on it do not touch
the live DOM until you `update(frag)`.
