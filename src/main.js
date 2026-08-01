/**
 * @file DOM Invisible Markers (dim).
 * Lightweight library for creating and managing invisible markers in the DOM.
 */

/**
 * `code` is parsed as HTML (via a `<template>` element) and inserted into the DOM —
 * never pass untrusted/user-supplied input without sanitizing it first.
 * Accepts either an HTML string or a DOM `Node` (e.g. a `DocumentFragment`).
 * Passing anything else (`null`, `undefined`, number, boolean, object, …) throws `TypeError`
 * BEFORE any mutation, so the existing range content is preserved.
 * @typedef {(code: string | Node, keepCache?: string) => void} RangeMutator
 */

/**
 * @typedef {Object} RangeApi
 * @property {RangeMutator} update  Replaces the range content with `code` (HTML string or Node); pass `'cache'` to save current content for undo.
 * @property {() => void} clearCache  Clears the undo cache.
 * @property {() => Node | null} getContext  Gets the common ancestor container of the range, or `null` if the markers are orphaned.
 * @property {() => boolean} isEmpty  `true` if the range is empty (collapsed) or the markers are orphaned.
 * @property {(keepCache?: string) => void} delete  Deletes all content within the range; pass `'cache'` to save current content for undo.
 * @property {() => void} back  Restores the most recently cached range content (undo).
 * @property {RangeMutator} prepend  Inserts `code` (HTML string or Node) at the start of the range's content area (immediately after the start marker); pass `'cache'` to save current content for undo.
 * @property {RangeMutator} append  Inserts `code` (HTML string or Node) at the end of the range's content area (immediately before the end marker); pass `'cache'` to save current content for undo.
 * @property {() => DocumentFragment | null} select  Returns a deep clone of the range contents as a `DocumentFragment` (safe to mutate without touching the live DOM); returns `null` when markers are orphaned.
 * @property {(keepCache?: string) => DocumentFragment | null} extract  Like `delete()` but returns the removed content as a `DocumentFragment`; pass `'cache'` to also enable undo via `back()`. The fragment is a CLONE of the removed content — node identity and event listeners added via `addEventListener` are not carried over.
 * @property {() => boolean} isOrphan  `true` if either marker has been detached from the DOM. Silent — no warning logged.
 * @property {() => string} toString  Returns the plain-text content of the range (empty string when orphaned).
 */

/**
 * @callback SetCallback
 * @param {{ start: Text, end: Text }} markers Invisible marker nodes; the callback must attach both to the DOM.
 * @param {...*} args Additional arguments forwarded by the caller.
 * @returns {string|void} Return a string to register the range under that alias. Returning an alias that already exists overwrites the old registration (the previous range stays reachable by its numeric index). Avoid all-digit aliases like `'0'` — alias lookup takes precedence over numeric indexes.
 */

/**
 * @typedef {Object} DimApi
 * @property {(fn: SetCallback, ...args: any[]) => void} set  Registers a new range with invisible start/end markers placed by `fn`.
 * @property {(name: string | number | (string | number)[]) => RangeApi | (RangeApi | undefined)[] | undefined} get  Retrieves one or more ranges by alias, numeric index, comma-separated names, or array of names/numbers.
 * @property {(names?: string | number | (string | number)[]) => void} reset  Selective: omit the argument to clear every range AND remove every marker still attached to the DOM; pass a name/index or an array of them to clear just those. Dropping a range removes every key that points to it — alias and numeric index alike.
 * @property {() => string[]} list  Returns all registry keys — aliases first (registration order), then numeric indexes (registration order). Aliases and indexes are deduplicated.
 * @property {() => string[]} aliases  Returns only the user-named aliases, in registration order.
 * @property {(name: string | number | (string | number)[]) => boolean} has  `true` if every requested range exists. Accepts a single key, an array, or a comma-separated string.
 */

/**
 * Creates a dim instance for managing invisible DOM markers.
 * @returns {DimApi} API to register, retrieve, and clear ranges.
 * @example
 * const d = dim();
 * d.set(({ start, end }) => { document.body.append(start, end); });
 * d.get('0').update('<p>Hello</p>');
 */
function dim () {
        let
              ranges    = {} // Numeric ranges - always added
            , aliasMap  = {} // Named ranges - added only if set function returns name
            , nextId    = 0  // Monotonic numeric id. Never reused — `Object.keys(ranges).length`
                             // would collide with a live range after a selective reset()
            ;
        /**
         * Registers a new range with invisible start and end markers in the DOM.
         * @param {Function} fn - Callback receiving `{start, end}` markers; may return a string to register an alias. Must attach both markers to the DOM before returning.
         * @param {...*} args - Additional arguments forwarded to the callback.
         * @returns {void}
         * @throws {TypeError} If `fn` is not a function.
         * @throws {Error} If the callback did not attach `start` and/or `end` to the DOM (`'dim.set: callback must attach both "start" and "end" markers to the DOM'`).
         * @example
         * d.set(({ start, end }) => {
         *   const div = document.createElement('div');
         *   div.appendChild(start);
         *   div.appendChild(end);
         *   document.body.appendChild(div);
         * }, arg1, arg2);
         */
        function set  ( fn, ...args ) {
                      if ( typeof fn !== 'function' )   throw new TypeError ( 'set() requires a function as the first argument' )
                      let
                            start = document.createTextNode ('')
                          , end   = document.createTextNode ('')
                          ;
                      let name = fn ( {start, end}, ...args )   // Apply start and end markers to the DOM
                      if ( !start.parentNode || !end.parentNode )   throw new Error ( 'dim.set: callback must attach both "start" and "end" markers to the DOM' )
                      const range = document.createRange ()
                      range.setStartAfter ( start )
                      range.setEndBefore ( end )
                      let rangeAPI = makeMyAPI ( range, start, end )
                      if ( name )   aliasMap[name] = rangeAPI
                      ranges[nextId++] = rangeAPI
              } // set func.
        /**
         * Retrieves one or more ranges by alias, numeric index, comma-separated names, or array of names/numbers.
         * Numeric input (`get(0)`) is coerced to its string form so the caller can use either spelling.
         * @param {string|number|string[]|number[]} name - Alias, numeric index (`'0'`, `'1'` or `0`, `1`), comma-separated names (`'a, b'`), or an array of names/numbers.
         * @returns {Object|Object[]|undefined} A single range API, an array of range APIs (entries may be `undefined` for missing keys), or `undefined` for any non-string non-array non-number argument.
         * @example
         * const r = d.get('0');           // By numeric index (string)
         * const r = d.get(0);             // By numeric index (number)
         * const r = d.get('myRange');     // By alias name
         * const [r1, r2] = d.get('a, b'); // Multiple by comma-separated
         * const [r1, r2] = d.get(['a', 'b']); // Multiple by array
         */
        function get ( name ) {
                    if ( name === undefined || name === null )   return undefined
                    if ( typeof name !== 'string' && typeof name !== 'number' && !Array.isArray ( name ) )   return undefined
                    const isMulti = Array.isArray ( name ) || ( typeof name === 'string' && name.includes ( ',' ) )
                    const list    = toList ( name )
                    const result  = list.map ( n => aliasMap[n] || ranges[n] )
                    return isMulti ? result : result[0]
              } // get func.
        /**
         * Selectively clears ranges and their markers.
         *
         * - No argument → drop every range and alias AND remove every marker still attached to the DOM.
         * - With a name/number → remove just that range's markers AND its registry entries (both the alias and the numeric index, whichever key was passed).
         * - With an array or comma-separated string → remove each listed range.
         * - With `null`, an object, or any other non-string non-number non-array → silent no-op (consistent with `get()` / `has()` — never throws on bad input).
         *
         * Closes the historical asymmetry: previously `reset()` only cleared the
         * registry and left the markers in the DOM.
         * @param {string|number|string[]|number[]} [names] Optional. Omit to clear everything; pass a single key, an array, or a comma-separated string to clear just those.
         * @returns {void}
         * @example
         * d.reset();           // clear everything
         * d.reset('intro');    // clear one alias
         * d.reset(0);          // clear by numeric index
         * d.reset(['a', 'b']); // clear multiple
         * d.reset(null);       // no-op (does not throw)
         */
        function reset ( names ) {
                    let keys
                    if ( names === undefined ) {
                              keys = dedupe ( Object.keys ( aliasMap ), Object.keys ( ranges ) )
                          }
                    else if ( typeof names === 'string' || typeof names === 'number' || Array.isArray ( names ) ) {
                              keys = toList ( names )
                          }
                    else {
                              return   // bad input — silent no-op, mirrors get/has
                          }
                    for ( const k of new Set ( keys ) ) {
                              const range = aliasMap[k] || ranges[k]
                              if ( !range )   continue
                              range.destroy ()
                              // Every range lives under BOTH a numeric id and (optionally) an
                              // alias — drop every key that points to it, or the surviving key
                              // would keep serving a destroyed range via get/has/list.
                              for ( const [ alias, r ] of Object.entries ( aliasMap ) )   if ( r === range )   delete aliasMap[alias]
                              for ( const [ id, r ]    of Object.entries ( ranges )   )   if ( r === range )   delete ranges[id]
                          }
              } // reset func.
        /**
         * Returns all registry keys — aliases first (registration order), then numeric indexes (registration order). Deduplicated.
         * @returns {string[]} Registry keys.
         * @example
         * d.list();     // → ['intro', 'sidebar', '0', '1']
         * d.aliases();  // → ['intro', 'sidebar']
         */
        function list () { return dedupe ( Object.keys ( aliasMap ), Object.keys ( ranges ) ) }
        /**
         * Returns only the user-named aliases, in registration order.
         * @returns {string[]} Alias names.
         * @example
         * d.aliases();
         */
        function aliases () { return Object.keys ( aliasMap ) }
        /**
         * Checks whether every requested range exists. Accepts a single key, an array, or a comma-separated string.
         * @param {string|number|string[]|number[]} name
         * @returns {boolean} `true` if every requested range is registered; `false` otherwise (including for invalid input types).
         * @example
         * d.has('intro');          // → true/false
         * d.has(0);                // → true/false
         * d.has(['a', 'b']);       // → true only if both exist
         * d.has('intro, sidebar'); // → true only if both exist
         */
        function has ( name ) {
                    if ( name === undefined || name === null )   return false
                    if ( typeof name !== 'string' && typeof name !== 'number' && !Array.isArray ( name ) )   return false
                    return toList ( name ).every ( n => !!( aliasMap[n] || ranges[n] ) )
              } // has func.

  return {
              set
            , get
            , reset
            , list
            , aliases
            , has
        }
} // dim func.



/**
 * Coerces a single name to its string form.
 * - Non-negative integers → string form (`0` → `'0'`).
 * - Anything else → returned unchanged.
 * Used so callers can pass either `0` or `'0'` to `get`/`has`/`reset`.
 * @param {*} n
 * @returns {*}
 * @private
 */
function coerceName ( n ) {
        if ( typeof n === 'number' && Number.isInteger ( n ) && n >= 0 )   return String ( n )
        return n
    } // coerceName func.



/**
 * Normalises a `get`/`has`/`reset` argument into a flat array of registry keys.
 * Accepts a single number, a string (which may be comma-separated), or an array
 * of strings/numbers. Anything else is passed through unchanged so the lookup
 * simply misses it.
 * @param {string|number|string[]|number[]} name
 * @returns {string[]}
 * @private
 */
function toList ( name ) {
        if ( typeof name === 'number' )   return [ coerceName ( name ) ]
        const arr = Array.isArray ( name ) ? name : name.split ( ',' )
        return arr.map ( s => ( typeof s === 'string' ? s.trim() : s ) ).map ( coerceName )
    } // toList func.



/**
 * Concatenates two key arrays and deduplicates while preserving first-seen order.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {string[]}
 * @private
 */
function dedupe ( a, b ) {
        return [ ...new Set ( [ ...a, ...b ] ) ]
    } // dedupe func.



/**
 * Internal function to convert HTML string to DOM nodes
 * @param {string} code - HTML string to convert
 * @returns {DocumentFragment} DOM fragment containing the parsed content
 * @private
 */
function _convertToDOM ( code ) {
    let fragment = document.createElement ( 'template' )
    fragment.innerHTML = code
    return fragment.content
} // convertToDOM func.



/**
 * Validates the `code` argument of `update` / `prepend` / `append`.
 * Must be either an HTML string or a DOM `Node`. Anything else (null,
 * undefined, number, boolean, object) is a usage error and must throw
 * a clear `TypeError` BEFORE any mutation — `update()` would otherwise
 * silently destroy the range content via `range.deleteContents()` and
 * then throw an opaque browser error, leaving the user with lost data
 * and a confusing message.
 * @param {*} code
 * @returns {void}
 * @throws {TypeError} If `code` is not a string and not a Node.
 * @private
 */
function _validateContentInput ( code ) {
    if ( typeof code === 'string' )   return
    if ( code instanceof Node )       return
    const label = ( code === null ) ? 'null' : ( Array.isArray ( code ) ? 'array' : typeof code )
    throw new TypeError ( `update/prepend/append require a string or a Node; received ${label}` )
} // validateContentInput func.



/**
 * Creates a range API for manipulating content between invisible markers.
 * @param {Range} range - The DOM Range object.
 * @param {Text} start - The start marker node.
 * @param {Text} end - The end marker node.
 * @returns {RangeApi & { destroy: () => void }} Range manipulation methods plus the internal `destroy()` hook used by `reset()`.
 * @private
 */
function makeMyAPI ( range, start, end ) {
    let cache = [];

    /**
     * Re-anchors the range to the original start/end markers.
     *
     * DOM Range spec quirks: `insertNode` moves the range's end position
     * to *after* the inserted content, and `deleteContents` collapses
     * the range. If we don't reset the range before each modifying
     * operation, the range's effective coverage shrinks over time — the
     * next `update`/`delete` operates on a smaller area, child markers
     * placed *between* the start and end are never deleted, and the
     * `validate()` orphan-detection check (which depends on the markers
     * actually being removed from the DOM) can never fire.
     *
     * Call this *after* `validate()` and *before* any operation that
     * uses the range object.
     *
     * @private
     * @returns {void}
     */
    function refreshRange () {
            range.setStartAfter ( start )
            range.setEndBefore  ( end )
        } // refreshRange func.

    /**
     * Validates that the range markers are still connected to the DOM.
     * When a parent range updates its content, nested range markers get deleted from the DOM.
     * @private
     * @returns {boolean} `true` if markers are connected, `false` if removed from DOM.
     */
    function validate () {
            if ( !start.isConnected || !end.isConnected ) {
                    console.warn ( 'Warning: Current range is not available in the DOM at this time' )
                    return false
                }
            return true
        } // validate func.

    /** @type {RangeApi & { destroy?: () => void }} */
    const api = {
/**
         * Updates the content within the range.
         * @param {string|Node} code - HTML string or DOM `Node` (e.g. `DocumentFragment`) to insert.
         * @param {string} [keepCache] - Pass `'cache'` to save the current range contents to the undo cache before modifying; default `''` skips caching.
         * @returns {void}
         * @throws {TypeError} If `code` is not a string and not a `Node`. Thrown BEFORE any mutation so existing content is preserved.
         * @example
         * range.update('<p>New content</p>');
         * range.update(document.createDocumentFragment(), 'cache'); // Save old to cache
         */
        update ( code, keepCache = '' ) {
            if ( !validate () )   return
            _validateContentInput ( code )
            refreshRange ()
            if ( keepCache === 'cache' )   cache.push ( range.cloneContents() )
            range.deleteContents ()
            range.insertNode ( typeof code === 'string' ? _convertToDOM ( code ) : code )
        },

        /**
         * Clears the content cache.
         * @returns {void}
         * @example
         * range.clearCache();
         */
        clearCache : () => { cache = [] },

        /**
         * Gets the common ancestor container of the range.
         * @returns {Node|null} The ancestor DOM node, or null if markers are orphaned
         * @example
         * const ctx = range.getContext();
         * if (!ctx) console.error('Range is orphaned');
         */
        getContext : () => {
                if ( !validate () )   return null
                return range.commonAncestorContainer
            },

        /**
         * Checks if the range is empty (collapsed) or orphaned.
         * @returns {boolean} True if range is empty or markers are orphaned
         * @example
         * if (range.isEmpty()) {
         *   // Range is empty or orphaned
         * }
         */
        isEmpty    : () => {
                if ( !validate () )   return true
                refreshRange ()
                return range.collapsed
            },

        /**
         * Deletes all content within the range.
         * @param {string} [keepCache] - Pass `'cache'` to save the current range contents to the undo cache before deleting; default `''` skips caching.
         * @returns {void}
         * @example
         * range.delete();
         * range.delete('cache'); // Save to cache first
         */
        delete     : ( keepCache = '' ) => {
            if ( !validate () )   return
            refreshRange ()
            if ( keepCache === 'cache' )   cache.push ( range.cloneContents() )
            range.deleteContents ()
        },

        /**
         * Restores the last deleted content from cache (undo).
         * @returns {void}
         * @example
         * range.back(); // Restores previous content
         */
        back () {
            if ( !validate () )   return
            refreshRange ()
            let content = cache.pop ()
            if ( content ) {
                range.deleteContents ()
                range.insertNode ( content )
            }
        },

        /**
         * Inserts content at the start of the range's content area (immediately after the start marker).
         * Existing range content stays in place — `prepend` only adds new content at the beginning.
         * @param {string|Node} code - HTML string or DOM `Node` (e.g. `DocumentFragment`) to insert.
         * @param {string} [keepCache] - Pass `'cache'` to save the current range contents to the undo cache before prepending; default `''` skips caching.
         * @returns {void}
         * @throws {TypeError} If `code` is not a string and not a `Node`. Thrown BEFORE any mutation so existing content is preserved.
         * @example
         * range.prepend('<b>Before</b>');
         * range.prepend(someFragment, 'cache');
         */
        prepend ( code, keepCache = '' ) {
            if ( !validate () )   return
            _validateContentInput ( code )
            refreshRange ()
            if ( keepCache === 'cache' )   cache.push ( range.cloneContents() )
            start.after ( typeof code === 'string' ? _convertToDOM ( code ) : code )
        },

        /**
         * Inserts content at the end of the range's content area (immediately before the end marker).
         * Existing range content stays in place — `append` only adds new content at the end.
         * @param {string|Node} code - HTML string or DOM `Node` (e.g. `DocumentFragment`) to insert.
         * @param {string} [keepCache] - Pass `'cache'` to save the current range contents to the undo cache before appending; default `''` skips caching.
         * @returns {void}
         * @throws {TypeError} If `code` is not a string and not a `Node`. Thrown BEFORE any mutation so existing content is preserved.
         * @example
         * range.append('<i>After</i>');
         * range.append(someFragment, 'cache');
         */
        append ( code, keepCache = '' ) {
            if ( !validate () )   return
            _validateContentInput ( code )
            refreshRange ()
            if ( keepCache === 'cache' )   cache.push ( range.cloneContents() )
            end.before ( typeof code === 'string' ? _convertToDOM ( code ) : code )
        },

        /**
         * Returns a deep clone of the range contents as a `DocumentFragment`.
         * The returned fragment is detached from the live DOM and safe to mutate
         * without affecting the original tree. Pair with `update(fragment)` for
         * a round-trip: read → mutate → write back.
         * Resolves the common "multiple sibling regions under a common parent"
         * case without relying on `window.getSelection()`.
         * @returns {DocumentFragment|null} Cloned content, or `null` if the range is orphaned.
         * @example
         * const frag = range.select();
         * frag.querySelectorAll('a').forEach(stripAnchor);
         * range.update(frag);
         */
        select () {
            if ( !validate () )   return null
            refreshRange ()
            return range.cloneContents ()
        },

        /**
         * Cuts the range content out and returns it as a `DocumentFragment`.
         * After `extract()` the range is empty. Use `'cache'` to keep the
         * content in the undo stack so `back()` can restore it.
         * The returned fragment is a CLONE of the removed content — node
         * identity and event listeners added via `addEventListener` are
         * not carried over.
         * @param {string} [keepCache] - Pass `'cache'` to enable `back()` undo; default `''` skips caching.
         * @returns {DocumentFragment|null} Removed content, or `null` if the range is orphaned.
         * @example
         * const frag = range.extract();
         * otherRegion.update(frag);
         */
        extract ( keepCache = '' ) {
            if ( !validate () )   return null
            refreshRange ()
            const cloned = range.cloneContents ()
            if ( keepCache === 'cache' )   cache.push ( cloned.cloneNode ( true ) )
            range.deleteContents ()
            return cloned
        },

        /**
         * Silent orphan check — `true` if either marker has been detached from the DOM.
         * Unlike `isEmpty()` / `getContext()` this does not log a `console.warn`.
         * @returns {boolean}
         * @example
         * if (range.isOrphan()) console.log('Range no longer in DOM');
         */
        isOrphan : () => !start.isConnected || !end.isConnected,

        /**
         * Returns the plain-text content of the range.
         * @returns {string} Text content (empty string when orphaned).
         * @example
         * console.log(range.toString());
         */
        toString : () => {
                if ( !validate () )   return ''
                refreshRange ()
                return range.toString ()
            }
    }

    // Attach the internal `destroy()` hook as a non-enumerable property so it
    // does not appear in `Object.keys(range)`, JSON.stringify(range), or any
    // iteration of the range object. `reset()` is the only caller.
    Object.defineProperty ( api, 'destroy', {
            enumerable : false,
            value () {
                    if ( start.isConnected )   start.parentNode.removeChild ( start )
                    if ( end.isConnected   )   end.parentNode.removeChild   ( end )
                }
        } )

    return /** @type {RangeApi & { destroy: () => void }} */ ( api )
} // makeMyAPI func.



export default dim