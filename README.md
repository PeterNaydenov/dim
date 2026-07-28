# Dim (@peter.naydenov/dim)

DIM (DOM Invisible Markers) is a library that creates invisible markers in the DOM so you can define ranges, insert content into them, and replace or restore that content later — without leaving any trace of the markers themselves.

*VERY EXPERIMENTAL STAGE — DON'T USE IN PRODUCTION. Interface may change multiple times in a short period of time. Versions under 1.x.x are not for use and will not follow semver rules*


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
const { default: dim } = require('@peter.naydenov/dim')
// or
const dim = require('@peter.naydenov/dim').default
```

UMD (browser via `<script>`, no bundler — exposes `window.dim`):

```html
<script src="./node_modules/@peter.naydenov/dim/dist/dim.umd.cjs"></script>
<script>
  const d = dim()
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

Extra args you pass to `set` are forwarded to the callback:

```js
d.set(({ start, end }, locale) => {
    container.prepend(start)
    container.append(end)
    return 'app'
}, 'en')
```

### 2. Look up ranges

`get` accepts an alias, a numeric index, a comma-separated string, or an array of names:

```js
const r            = d.get('app')            // → rangeApi
const r2           = d.get('0')              // → rangeApi (first range)
const [a, b]       = d.get('a, b')           // → [rangeApi, rangeApi]
const [x, y]       = d.get(['x', 'y'])       // → [rangeApi, rangeApi]
const nothing      = d.get(null)             // → undefined (no throw)
```

### 3. Replace the content

```js
app.update('Hello World')
app.update('<p>Hello <b>World</b></p>')   // HTML strings are parsed
```

`code` is parsed as HTML and inserted into the DOM (`update`, `prepend`, `append`) — never pass untrusted/user-supplied input without sanitizing it first.

### 4. Cache + undo

Pass `'cache'` as the second argument to `update` (or `delete`) to save the current content for later. `back()` restores the most recently cached snapshot.

```js
app.update('Hello World')
app.update('Hello World 2', 'cache')   // caches 'Hello World'
app.back()                              // restores 'Hello World'
```

### 5. Prepend / append outside the range

`prepend` inserts *before* the start marker; `append` inserts *after* the end marker. Both leave the existing range content alone and accept an optional `'cache'` argument.

```js
app.append('! <span>Extra</span>')
app.prepend('1. ')
// content is now: '1. Hello World! <span>Extra</span>'
```

### 6. Inspect, clear, reset

```js
app.getContext()   // → first common ancestor of start + end, or null if orphaned
app.isEmpty()      // → true if no content between the markers
app.delete()       // → remove range content (pass 'cache' to save it)
app.clearCache()   // → drop every cached snapshot for this range
d.reset()          // → drop every range and alias
```


## Dim API

Methods on the object returned by `dim()`.

| Method | Signature | Description |
| --- | --- | --- |
| `set` | `set(fn, ...args) → void` | Register a new range. `fn({ start, end }, ...args)` is called synchronously and must place `start` and `end` in the DOM. If `fn` returns a string, that string becomes an alias for the range; the range is also reachable by its numeric index. Throws `TypeError` if `fn` is not a function. |
| `get` | `get(name) → rangeApi \| rangeApi[] \| undefined` | Look up ranges by alias name, numeric index (`'0'`, `'1'`, …), comma-separated string (`'a, b'`), or an array of names. Returns `undefined` (or `[]` for an empty array) if nothing matches — never throws on bad input. |
| `reset` | `reset() → void` | Drop every range and alias. |


## Range API

Methods exposed on each range object returned by `get`.

| Method | Signature | Description |
| --- | --- | --- |
| `update` | `update(code, keepCache?) → void` | Replace the range content with `code` (an HTML string). Pass `'cache'` as the second argument to save the current content for `back()`. |
| `delete` | `delete(keepCache?) → void` | Remove the range content. Pass `'cache'` to save it. |
| `back` | `back() → void` | Restore the most recently cached snapshot, if any, and remove it from the cache. |
| `clearCache` | `clearCache() → void` | Drop every cached snapshot for this range. |
| `prepend` | `prepend(code, keepCache?) → void` | Insert `code` *before* the start marker. The existing range content is left in place. Pass `'cache'` to save the current range content. |
| `append` | `append(code, keepCache?) → void` | Insert `code` *after* the end marker. The existing range content is left in place. Pass `'cache'` to save the current range content. |
| `getContext` | `getContext() → Node \| null` | The first common ancestor of `start` and `end`. Returns `null` if the range is orphaned. |
| `isEmpty` | `isEmpty() → boolean` | `true` if the range is empty (no content between the markers) or if the range is orphaned. |


## Orphan detection

A "parent" range whose `update` or `delete` removes the markers of any "child" range that was placed between them leaves the child range **orphaned** — its `start` and `end` `Text` nodes are no longer in the DOM tree. The mutating and inspection methods guard against this: they check both markers are still connected, and if not, they log a single `console.warn` and return gracefully:

- `update` / `delete` / `prepend` / `append` / `back` → no-op
- `getContext` → `null`
- `isEmpty` → `true`
- `clearCache` → no-op (it only mutates the internal cache, which is harmless on an orphaned range)

A `refreshRange()` is performed at the start of every modifying operation so the underlying `Range` always covers `[after start, before end]`, regardless of how many `update`s preceded it.


## Links

- [Changelog](https://github.com/PeterNaydenov/dim/blob/main/Changelog.md)


## Credits

'@peter.naydenov/dim' was created and supported by Peter Naydenov.


## License

'@peter.naydenov/dim' is released under the [MIT License](http://opensource.org/licenses/MIT).
