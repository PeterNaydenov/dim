# Full API Reference — `@peter.naydenov/dim` v1.0.0

> All signatures match `dist/main.d.ts` and the JSDoc on the implementation.
> The default export is the factory: `import dim from '@peter.naydenov/dim'`.

## Module system

| System | Path                          | How `dim` is exposed                                |
| ------ | ----------------------------- | --------------------------------------------------- |
| ESM    | `dist/dim.js`                 | `import dim from '@peter.naydenov/dim'`             |
| CJS    | `dist/dim.cjs`                | `const dim = require('@peter.naydenov/dim')`        |
| UMD    | `dist/dim.umd.cjs`            | `<script>` → `window.dim` (the function itself)     |

As of v1.0.0 the CJS bundle and the UMD bundle both expose `dim` as the
function directly. Pre-1.0.0 returned `{ default: [Function] }` — the
`Changelog.md` notes this as a breaking change.

The UMD path is exposed via `package.json` `exports["./umd"]` →
`./dist/dim.umd.cjs`.

## `DimApi` — methods on the object returned by `dim()`

| Method   | Signature                                                                 | Notes                                                                                       |
| -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `set`    | `set(fn, ...args) → void`                                                 | `fn({ start, end }, ...args)` is called sync. Must attach BOTH markers. Returns string = alias. Throws `TypeError` if `fn` is not a function. Throws `Error` if markers are not attached. |
| `get`    | `get(name) → RangeApi \| RangeApi[] \| undefined`                         | `name` = alias, numeric (`'0'` or `0`), comma-separated (`'a, b'`), or array of either. Returns `undefined` (or `[]` for empty array) on bad input — never throws. |
| `reset`  | `reset(names?) → void`                                                    | No arg → drop every range + every DOM marker. With arg → drop just those; every key pointing to a dropped range is removed, alias and numeric index alike. Bad input → silent no-op. |
| `list`   | `list() → string[]`                                                       | Every registry key — aliases first (registration order), then numeric indexes, deduplicated. |
| `aliases`| `aliases() → string[]`                                                    | Only the user-named aliases, in registration order. |
| `has`    | `has(name) → boolean`                                                     | `true` only if every requested range exists. Same input shapes as `get`. Returns `false` on bad input. |

## `RangeApi` — methods on each range object returned by `get`

| Method        | Signature                                                       | Notes                                                                                       |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `update`      | `(code, keepCache?) → void`                                     | `code` = HTML string OR `Node`. Pass `'cache'` to save current content for `back()`. Throws `TypeError` on bad input BEFORE any mutation. |
| `delete`      | `(keepCache?) → void`                                           | Remove range content. Pass `'cache'` to save first. |
| `prepend`     | `(code, keepCache?) → void`                                     | Insert AT START of range content (after `start` marker, INSIDE the range). Existing content stays. |
| `append`      | `(code, keepCache?) → void`                                     | Insert AT END of range content (before `end` marker, INSIDE the range). Existing content stays. |
| `select`      | `() → DocumentFragment \| null`                                 | Deep clone of range contents. Detached — safe to mutate. Returns `null` when orphaned. |
| `extract`     | `(keepCache?) → DocumentFragment \| null`                       | Like `delete()` but returns the removed content as a fragment. The fragment is a CLONE — node identity and `addEventListener` listeners are not carried over. Pass `'cache'` to enable undo. |
| `back`        | `() → void`                                                     | Restore most recently cached snapshot, pop it from cache. No-op if cache empty. |
| `clearCache`  | `() → void`                                                     | Drop every cached snapshot. No-op on orphaned range (does not log a warning). |
| `getContext`  | `() → Node \| null`                                             | First common ancestor of `start` and `end`. `null` when orphaned. |
| `isEmpty`     | `() → boolean`                                                  | `true` if range is collapsed or orphaned. |
| `isOrphan`    | `() → boolean`                                                  | `true` if either marker is detached from DOM. SILENT — no warning logged. |
| `toString`    | `() → string`                                                   | Plain-text content of the range. Empty string when orphaned. |

## `select` → `update` round-trip (the read-mutate-write pattern)

`select()` returns a `DocumentFragment` that is detached from the live
DOM. You can mutate it freely and push it back with `update(fragment)`.
This is the only safe way to transform existing range content when
multiple regions share a common parent — `window.getSelection()` cannot
disambiguate sibling regions, `select()` can.

```js
const r = d.get('feed')
const frag = r.select()                                // detached
frag.querySelectorAll('.old-class')
    .forEach(el => el.classList.replace('old-class', 'new-class'))
frag.querySelectorAll('a[target="_blank"]')
    .forEach(a => a.removeAttribute('target'))
r.update(frag)                                         // push back
```

The same fragment can be passed to `update`, `prepend`, or `append`.
Passing a `Node` (any kind) bypasses HTML parsing — useful for sanitized
content built with `createElement` + `textContent`.

## `get` input shapes

| Input                  | Result                                                          |
| ---------------------- | --------------------------------------------------------------- |
| `'feed'`               | The range aliased `'feed'`, or `undefined`                       |
| `'0'` or `0`           | The first-registered range                                      |
| `['a', 'b']`           | `[RangeApi, RangeApi]` — array form always returns an array      |
| `'a, b'`               | Same as `['a', 'b']` — comma-separated is split on `,` then trimmed |
| `['first', 1]`         | Mixed types work — non-negative integer is coerced to its string form |
| `[]`                   | `[]` (empty array — does NOT throw)                              |
| `null` / `undefined` / `{}` / `42` (out of range) | `undefined` (does NOT throw)         |

`has` mirrors the same shapes but returns `true` / `false`.

## `set` callback contract

```js
d.set(({ start, end }, ...args) => {
  // BOTH start and end MUST be attached to the DOM before this returns.
  // Common attachment points:
  host.prepend(start)        // host becomes start.parentNode
  host.append(end)           // host becomes end.parentNode
  // OR
  parent.insertBefore(start, parent.firstChild)
  parent.insertBefore(end, null)   // same as parent.appendChild(end)
  // OR — for a slot around an existing element:
  existingEl.before(start)
  existingEl.after(end)
  return 'my-alias'          // optional; if absent, the range is numeric-only
}, 'arg1', 'arg2')           // args are forwarded to the callback
```

If the callback does not attach both markers, `set` throws:
`Error: dim.set: callback must attach both "start" and "end" markers to the DOM`.

## `reset` behaviour by argument

| Call                    | Effect                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| `d.reset()`             | Drop every range from the registry AND remove every marker from the DOM |
| `d.reset('feed')`       | Drop the range aliased `'feed'` and detach its markers — its numeric index is removed too |
| `d.reset(0)`            | Drop the first range (numeric form)                                 |
| `d.reset(['a', 'b'])`   | Drop several at once                                                |
| `d.reset(null)`         | Silent no-op (consistent with `get` / `has`)                        |
| `d.reset(undefined)`    | Same as `d.reset()` — clears everything                             |
