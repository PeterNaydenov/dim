# Pitfalls — things that look right but bite

> Read this BEFORE writing code that handles user input, nests ranges, or
> runs in a test environment. Each section names the failure mode, the
> contract, and the safe pattern.

## 1. XSS — the HTML string form of `update` is parsed live

`update('<b>hello</b>')` is parsed through `<template>.innerHTML` and
the resulting nodes are inserted into the live DOM. There is NO escaping
or sanitization in the library — passing `update(userInput)` is an XSS
sink equivalent to `el.innerHTML = userInput`.

**Safe patterns (pick one):**

```js
// (a) Sanitize first.
import DOMPurify from 'dompurify'
r.update(DOMPurify.sanitize(userInput))

// (b) Build a DocumentFragment with textContent (no HTML parsing).
const frag = document.createDocumentFragment()
const p = document.createElement('p')
p.textContent = userInput               // textContent never parses HTML
frag.appendChild(p)
r.update(frag)

// (c) Update with a pre-trusted string from your own code.
r.update(`<p>${escapeHtml(userInput)}</p>`)
```

Patterns (b) and (c) are equivalent in safety; (b) is faster and
preserves any DOM structure you've built.

The Node form (`update(fragment)` / `update(element)`) bypasses
`<template>.innerHTML` entirely — the Node is inserted with
`range.insertNode`. This is the recommended path for any data that
might contain characters like `<`, `>`, `&`, or quotes.

## 2. Orphan ranges — parent `update` can delete child markers

A "parent" range whose `update('')` removes all content between its
markers also removes any "child" range markers placed between them.
The child's `start` and `end` `Text` nodes are now detached from the
DOM, and every mutating method on the child range becomes a no-op
that logs `console.warn("Warning: Current range is not available in the DOM at this time")`.

**How to detect:**

```js
const r = d.get('child')
if (r.isOrphan()) {                  // silent — safe in UI loops
  // re-create the range
  d.set(/* same setup as before */)
}
```

**How to avoid:** don't nest ranges where the parent can be cleared
out from under the child. If you do nest, the child is one-shot:
`select()` it FIRST (clones the content), THEN mutate the parent.

```js
const child = d.get('child')
const childFrag = child.select()      // snapshot before parent update
parent.update('')                     // child is now orphaned — fine, we cloned it
// childFrag is detached and safe to use
```

`isOrphan()` is the only method that does NOT log a warning when the
range is orphaned. Every other mutating / inspecting method logs once
and returns the "safe" value (no-op for mutators, `null` for `select`
/ `getContext`, `true` for `isEmpty`, `''` for `toString`).

## 3. Bad input to `update` / `prepend` / `append` throws

Passing `null`, `undefined`, `0`, `false`, `{}`, `[]`, or `true` to
any of these methods throws `TypeError` BEFORE any mutation:

```
TypeError: update/prepend/append require a string or a Node; received <type>
```

The throw is intentional and the pre-mutation state is preserved.
This is a strict improvement over pre-1.0.0 behaviour, which silently
destroyed range content via `range.deleteContents()` and then threw
an opaque browser error.

**What this means in practice:** if you have any chance of receiving
non-string non-Node input, guard the call site:

```js
if (typeof payload === 'string' || payload instanceof Node) {
  r.update(payload)
} else {
  console.warn('refusing to update with', typeof payload)
}
```

Or build a `DocumentFragment` from typed values first.

## 4. `prepend` / `append` insert INSIDE the range, not outside

The names suggest "before everything" / "after everything", but they
actually insert at the start / end of the range's CONTENT AREA:

```js
r.update('<span>middle</span>')       // range content: [span]
r.prepend('<b>head</b>')              // [b, span]   — head inserted INSIDE, before span
r.append('<i>tail</i>')               // [b, span, i]
```

This was a documented-but-counterintuitive API choice that was a
common source of bugs — confirmed by the 0.1.4 changelog entry that
added explicit position tests. If you want to insert OUTSIDE the
markers, place nodes via `start.before(node)` / `end.after(node)`
yourself — but be aware that won't be inside any range and won't be
tracked by dim.

## 5. Browser-only — no SSR, no Node.js

`dim` calls `document.createTextNode`, `document.createRange`,
`Node.isConnected`, etc. on every operation. It is not usable in
server-side rendering, server-side rendering of any kind (Next.js
`getServerSideProps`, etc.), or in a pure Node.js script.

For tests: `vitest` + `jsdom` works. Pattern:

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'jsdom' }
})
```

```js
import { beforeEach } from 'vitest'
import dim from '@peter.naydenov/dim'

let d
beforeEach(() => {
  document.body.innerHTML = ''         // reset between tests
  d = dim()
})
```

If you need to dim-test inside a non-browser runtime, mock the DOM
first — the library does not provide a "headless" mode.

## 6. `'cache'` is a string, not a boolean

```js
r.update('new', 'cache')              // correct — string literal
r.update('new', true)                 // WRONG — `true` is not 'cache', no snapshot
```

The library checks `keepCache === 'cache'`. Anything that isn't the
exact string `'cache'` skips caching silently. There is no boolean
form, no `'true'`, no constant to import.

## 7. `reset()` is total — it removes DOM markers too (v1.0.0+)

Pre-1.0.0: `d.reset()` only cleared the internal registry, leaving
markers in the DOM. v1.0.0 changed this: `d.reset()` (no argument)
removes every marker that is still connected to the DOM AND clears
the registry.

If you have code that relies on "reset clears the registry but
keeps the markers for re-attach", that contract no longer holds.
The new contract is symmetric: `d.reset()` cleans up both halves.

For selective removal, pass the same input shapes as `get`:
`d.reset('feed')`, `d.reset(0)`, `d.reset(['a','b'])`, etc. Dropping a
range removes EVERY key that points to it — resetting by alias also
removes its numeric index and vice versa, so no stale key keeps serving
a destroyed range. Numeric ids are monotonic and never reused: a `set()`
after a selective reset gets a fresh id, it does not fill the gap.

## 8. CJS / UMD module shapes (v1.0.0+)

Pre-1.0.0:

```js
const { default: dim } = require('@peter.naydenov/dim')  // had to destructure
```

v1.0.0+:

```js
const dim = require('@peter.naydenov/dim')               // function directly
```

If you need to support both pre-1.0.0 and 1.0.0+ consumers, use a
defensive normalize:

```js
const mod = require('@peter.naydenov/dim')
const dim = (typeof mod === 'function') ? mod : mod.default
```

UMD: `window.dim` is the function directly as of v1.0.0 (previously
it was `window.dim.default`).

## 9. `select()` works where `window.getSelection()` does not

`window.getSelection()` cannot disambiguate sibling regions that
share a common parent — both regions would fall into the same
`Selection`. `range.select()` returns a `DocumentFragment` scoped
strictly to `[start, end]`, so it works correctly even when two
ranges live inside the same `<div>`. This is the documented
"motivating use case" for `select()` in the library.

## 10. `select()` returns a clone, not a live reference

The fragment from `select()` is detached from the live DOM. Mutations
to it do NOT propagate to the live tree. To apply the mutations, push
the fragment back with `update(frag)`. This is the safe pattern; if
you need to mutate the live DOM directly, use `getContext()` to get
the container and operate on it (bypassing dim entirely).

## 11. `back()` is a stack, not a buffer

Each `'cache'` call pushes ONE snapshot. `back()` pops ONE. If you
push three snapshots, you need three `back()` calls to fully unwind.
There is no "rewind to start" or "skip to end" — implement those by
saving more state yourself or using `d.reset()` to drop everything.

## 12. `extract()` returns a clone — event listeners are lost

Like `select()`, the fragment returned by `extract()` is a CLONE of the
removed content, not the original nodes. Node identity and event
listeners attached with `addEventListener` are not carried over. When
moving a region into another slot, re-wire its listeners after
re-inserting the fragment (or use event delegation on a stable ancestor
so nothing needs re-wiring).
