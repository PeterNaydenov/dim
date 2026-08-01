# Dim (@peter.naydenov/dim)

[![npm version](https://img.shields.io/npm/v/@peter.naydenov/dim.svg)](https://www.npmjs.com/package/@peter.naydenov/dim)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript types](https://img.shields.io/badge/types-included-3178c6.svg)](https://www.typescriptlang.org)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@peter.naydenov/dim)](https://bundlephobia.com/package/@peter.naydenov/dim)

DIM (DOM Invisible Markers) is a library that creates invisible markers in the DOM so you can define ranges, insert content into them, and replace or restore that content later — without leaving any trace of the markers themselves.


## What is Dim?

Most DOM-manipulation libraries either wrap the content (forcing you to choose a mount element up front) or work with HTML strings that lose reference to live nodes. Dim does neither: it gives you two `Text` nodes — a `start` and an `end` — and you place them anywhere in the DOM. A `Range` between them is what you can then read, replace, undo, prepend to, or append to. The markers stay in the tree but render as empty text, so they're invisible at runtime.

Typical uses: editable regions, hot-swap content areas, A/B-test slots, "loading…" placeholders that get replaced once data arrives.


## Installation

```bash
npm i @peter.naydenov/dim
```

ESM:

```js
import dim from '@peter.naydenov/dim'
```

CommonJS (uses `./dist/dim.cjs` via the package's `exports` field):

```js
const dim = require('@peter.naydenov/dim')
```

UMD (browser via `<script>`, no bundler — exposes the function directly as `window.dim`):

```html
<script src="./node_modules/@peter.naydenov/dim/dist/dim.umd.cjs"></script>
<script>
  const d = dim()    // window.dim is the function itself
  // ...
</script>
```


## Usage

### 1. Create a range

`set` hands you two `Text` nodes. You place them in the DOM however you like. If the callback returns a string, that string becomes an alias you can pass to `get`.

```js
import dim from '@peter.naydenov/dim'
const d = dim()

d.set(({ start, end }) => {
    const container = document.querySelector('#app')
    container.prepend(start)   // start marker
    container.append(end)      // end marker
    return 'app'               // optional alias
})

const app  = d.get('app')         // by alias
const first = d.get('0')          // by numeric index
```

Two alias caveats: returning an alias that already exists **overwrites** the old registration (the previous range stays reachable by its numeric index), and all-digit aliases like `'0'` should be avoided — alias lookup takes precedence over numeric indexes in `get`/`has`/`reset`.

Extra args you pass to `set` are forwarded to the callback:

```js
d.set(({ start, end }, locale) => {
    container.prepend(start)
    container.append(end)
    return 'app'
}, 'en')
```

### 2. Look up ranges

`get` accepts an alias, a numeric index (either as a string `'0'` or as a number `0`), a comma-separated string, or an array of names/numbers:

```js
const r            = d.get('app')            // → rangeApi
const r2           = d.get('0')              // → rangeApi (first range)
const r3           = d.get(0)                // → rangeApi (number form also accepted)
const [a, b]       = d.get('a, b')           // → [rangeApi, rangeApi]
const [x, y]       = d.get(['x', 'y'])       // → [rangeApi, rangeApi]  (mixed types OK)
const nothing      = d.get(null)             // → undefined (no throw)
```

### 3. Replace the content

```js
app.update('Hello World')
app.update('<p>Hello <b>World</b></p>')   // HTML strings are parsed
```

`update`, `prepend`, and `append` accept either an HTML string or a DOM `Node` (typically a `DocumentFragment` — see *Read → mutate → write back* below). When you pass a string it is parsed as HTML and inserted into the DOM — never pass untrusted/user-supplied input without sanitizing it first.

### 4. Cache + undo

Pass `'cache'` as the second argument to `update`, `delete`, `extract`, `prepend`, or `append` to save the current range content for later. `back()` restores the most recently cached snapshot.

```js
app.update('Hello World')
app.update('Hello World 2', 'cache')   // caches 'Hello World'
app.back()                              // restores 'Hello World'
```

### 5. Read → mutate → write back

`select()` returns a deep clone of the range contents as a `DocumentFragment`. The fragment is detached from the live DOM, so you can manipulate it freely and push it back with `update()`. No `window.getSelection()` needed, and it works correctly even when multiple regions share a common parent.

The shape of the workflow is always the same — read, mutate, write back:

```js
// 1. Read: clone the region into a fragment.
const frag = app.select()

// 2. Mutate: any standard DOM operation works on the fragment.
//    Here we add the class "intro" to every <p> inside it.
frag.querySelectorAll('p').forEach(p => p.classList.add('intro'))

// 3. Write: push the cleaned fragment back into the range.
app.update(frag)
```

`extract(keepCache?)` does the same thing as `delete()` but returns the removed content as a fragment first — useful for *moving* a region into another slot. Note that the fragment is a **clone** of the removed content: node identity and event listeners attached with `addEventListener` are not carried over, so re-wire any listeners after re-inserting it.

### 6. Prepend / append inside the range

`prepend` inserts at the **start of the range's content area** (immediately after the start marker); `append` inserts at the **end of the range's content area** (immediately before the end marker). Both methods write *inside* the range — they only add to the beginning or end, leaving existing range content in place. They accept an optional `'cache'` argument.

```js
app.append('! <span>Extra</span>')
app.prepend('1. ')
// range content is now: '1. Hello World! <span>Extra</span>'
```

### 7. Inspect, clear, reset

```js
app.getContext()   // → first common ancestor of start + end, or null if orphaned
app.isEmpty()      // → true if no content between the markers
app.isOrphan()     // → true if the markers have been removed from the DOM (silent — no warning)
app.toString()     // → plain-text content of the range
app.delete()       // → remove range content (pass 'cache' to save it)
app.clearCache()   // → drop every cached snapshot for this range
app.extract()      // → like delete(), but returns the removed content as a DocumentFragment

d.list()           // → every registry key (aliases first, then numeric indexes)
d.aliases()        // → only the user-named aliases
d.has('app')       // → true if the range exists
d.has(['a', 'b'])  // → true only if every requested range exists
d.reset()          // → drop every range, alias, and remove every marker from the DOM
d.reset('app')     // → drop just that range (markers + alias + numeric entry)
d.reset(0)         // → drop just the first range (numeric form)
d.reset(['a', 'b'])// → drop several ranges at once
d.reset(null)      // → silent no-op (never throws on bad input — consistent with get/has)
```


## Dim API

Methods on the object returned by `dim()`.

| Method | Signature | Description |
| --- | --- | --- |
| `set` | `set(fn, ...args) → void` | Register a new range. `fn({ start, end }, ...args)` is called synchronously and must place `start` and `end` in the DOM. If `fn` returns a string, that string becomes an alias for the range; the range is also reachable by its numeric index. Throws `TypeError` if `fn` is not a function. |
| `get` | `get(name) → rangeApi \| rangeApi[] \| undefined` | Look up ranges by alias, numeric index (`'0'`, `'1'`, … or `0`, `1`), comma-separated string (`'a, b'`), or an array of names/numbers. Returns `undefined` (or `[]` for an empty array) if nothing matches — never throws on bad input. |
| `reset` | `reset(names?) → void` | Drop ranges AND remove their markers from the DOM. No argument → drop every range. Pass an alias, numeric index, array, or comma-separated string to drop just those — dropping a range removes every key that points to it, alias and numeric index alike. Silent no-op on bad input (never throws — consistent with `get`/`has`). |
| `list` | `list() → string[]` | Every registry key — aliases first (registration order), then numeric indexes (registration order). Deduplicated. |
| `aliases` | `aliases() → string[]` | Only the user-named aliases, in registration order. |
| `has` | `has(name) → boolean` | `true` if every requested range exists. Accepts a single key, an array, or a comma-separated string. |


## Range API

Methods exposed on each range object returned by `get`.

| Method | Signature | Description |
| --- | --- | --- |
| `update` | `update(code, keepCache?) → void` | Replace the range content with `code` (an HTML string or a DOM `Node`). Pass `'cache'` as the second argument to save the current content for `back()`. Throws `TypeError` if `code` is not a string and not a `Node` — the throw happens BEFORE any mutation, so existing content is preserved. |
| `delete` | `delete(keepCache?) → void` | Remove the range content. Pass `'cache'` to save it. |
| `extract` | `extract(keepCache?) → DocumentFragment \| null` | Like `delete()` but returns the removed content as a `DocumentFragment`. The fragment is a clone — node identity and `addEventListener` listeners are not carried over. Pass `'cache'` to also enable undo via `back()`. |
| `select` | `select() → DocumentFragment \| null` | Deep clone of the range contents. The fragment is detached from the live DOM and safe to mutate. Returns `null` when orphaned. |
| `back` | `back() → void` | Restore the most recently cached snapshot, if any, and remove it from the cache. |
| `clearCache` | `clearCache() → void` | Drop every cached snapshot for this range. |
| `prepend` | `prepend(code, keepCache?) → void` | Insert `code` (string or `Node`) at the **start** of the range's content area (immediately after the start marker). Existing range content stays in place. Pass `'cache'` to save the current range content. Throws `TypeError` on bad input — preserved like `update`. |
| `append` | `append(code, keepCache?) → void` | Insert `code` (string or `Node`) at the **end** of the range's content area (immediately before the end marker). Existing range content stays in place. Pass `'cache'` to save the current range content. Throws `TypeError` on bad input — preserved like `update`. |
| `getContext` | `getContext() → Node \| null` | The first common ancestor of `start` and `end`. Returns `null` if the range is orphaned. |
| `isEmpty` | `isEmpty() → boolean` | `true` if the range is empty (no content between the markers) or if the range is orphaned. |
| `isOrphan` | `isOrphan() → boolean` | `true` if either marker has been detached from the DOM. Silent — no warning logged. |
| `toString` | `toString() → string` | Plain-text content of the range (empty string when orphaned). |


## Orphan detection

A "parent" range whose `update` or `delete` removes the markers of any "child" range that was placed between them leaves the child range **orphaned** — its `start` and `end` `Text` nodes are no longer in the DOM tree. The mutating and inspection methods guard against this: they check both markers are still connected, and if not, they log a single `console.warn` and return gracefully:

- `update` / `delete` / `extract` / `prepend` / `append` / `back` → no-op
- `select` → `null`
- `getContext` → `null`
- `isEmpty` → `true`
- `toString` → `''`
- `clearCache` → no-op (it only mutates the internal cache, which is harmless on an orphaned range)

`isOrphan()` is the one exception — it returns a boolean *without* logging a warning, so it's safe to use inside UI loops or change-detection code.

A `refreshRange()` is performed at the start of every modifying operation so the underlying `Range` always covers `[after start, before end]`, regardless of how many `update`s preceded it.


## Links

- [Changelog](https://github.com/PeterNaydenov/dim/blob/main/Changelog.md)


## Credits

'@peter.naydenov/dim' was created and supported by Peter Naydenov.


## License

'@peter.naydenov/dim' is released under the [MIT License](http://opensource.org/licenses/MIT).
