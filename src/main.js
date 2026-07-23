/**
 * @file DOM Invisible Markers (dim).
 * Lightweight library for creating and managing invisible markers in the DOM.
 */

/**
 * @typedef {(code: string, keepCache?: string) => void} RangeMutator
 */

/**
 * @typedef {Object} RangeApi
 * @property {RangeMutator} update  Replaces the range content with `code` (HTML string); pass `'cache'` to save current content for undo.
 * @property {() => void} clearCache  Clears the undo cache.
 * @property {() => Node | null} getContext  Gets the common ancestor container of the range, or `null` if the markers are orphaned.
 * @property {() => boolean} isEmpty  `true` if the range is empty (collapsed) or the markers are orphaned.
 * @property {(keepCache?: string) => void} delete  Deletes all content within the range; pass `'cache'` to save current content for undo.
 * @property {() => void} back  Restores the most recently cached range content (undo).
 * @property {RangeMutator} prepend  Inserts `code` (HTML string) before the start marker; pass `'cache'` to save current content for undo.
 * @property {RangeMutator} append  Inserts `code` (HTML string) after the end marker; pass `'cache'` to save current content for undo.
 */

/**
 * @callback SetCallback
 * @param {{ start: Text, end: Text }} markers Invisible marker nodes; the callback must attach both to the DOM, or range creation throws.
 * @param {...*} args Additional arguments forwarded by the caller.
 * @returns {string|void} Return a string to register the range under that alias.
 */

/**
 * @typedef {Object} DimApi
 * @property {(fn: SetCallback, ...args: any[]) => void} set  Registers a new range with invisible start/end markers placed by `fn`.
 * @property {(name: string | string[]) => RangeApi | (RangeApi | undefined)[] | undefined} get  Retrieves one or more ranges by alias, numeric index, or comma-separated names.
 * @property {() => void} reset  Clears internal bookkeeping (ranges and aliases); does not remove marker nodes already inserted in the DOM.
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
              ranges  = {} // Numeric ranges - always added
            , aliases = {} // Named ranges - added only if set function returns name
            ;
        /**
         * Registers a new range with invisible start and end markers in the DOM.
         * @param {Function} fn - Callback receiving `{start, end}` markers; may return a string to register an alias.
         * @param {...*} args - Additional arguments forwarded to the callback.
         * @returns {void}
         * @throws {TypeError} If `fn` is not a function.
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
                      let name = fn ( {start, end}, ...args )   // Apply start and end makers to the DOM
                      const range = document.createRange ()
                      range.setStartAfter ( start )
                      range.setEndBefore ( end )
                      let rangeAPI = makeMyAPI ( range, start, end )
                      if ( name )   aliases[name] = rangeAPI
                      let num = Object.keys ( ranges ).length;
                      ranges[num] = rangeAPI
              } // set func.
        /**
         * Retrieves one or more ranges by alias, numeric index, or comma-separated names.
         * @param {string|string[]} name - Alias, numeric index (`'0'`, `'1'`), comma-separated names (`'a, b'`), or an array of names.
         * @returns {Object|Object[]|undefined} A single range API, an array of range APIs (entries may be `undefined` for missing keys), or `undefined` for any non-string non-array argument.
         * @example
         * const r = d.get('0');           // By numeric index
         * const r = d.get('myRange');     // By alias name
         * const [r1, r2] = d.get('a, b'); // Multiple by comma-separated
         * const [r1, r2] = d.get(['a', 'b']); // Multiple by array
         */
        function get ( name ) {
                    // Defensive: `name.includes` would throw on undefined /
                    // null / non-string. Return `undefined` for any non-string
                    // non-array argument so the call is harmless instead of
                    // crashing the consumer.
                    if ( typeof name !== 'string' && !Array.isArray ( name ) )   return undefined
                    if ( typeof name === 'string' && name.includes (','))   name = name.split ( ',').map ( n => n.trim() )
                    return (name instanceof Array) ? name.map ( n => aliases[n] || ranges[n] ) : aliases[name] || ranges[name]
              } // get func.
        /**
         * Resets the dim instance, clearing all ranges and aliases.
         * @returns {void}
         * @example
         * d.reset();
         */
        function reset () {
                  ranges = {}
                  aliases = {}
            }

  return {
              set
            , get
            , reset
        }
} // dim func.



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
 * Creates a range API for manipulating content between invisible markers.
 * @param {Range} range - The DOM Range object.
 * @param {Text} start - The start marker node.
 * @param {Text} end - The end marker node.
 * @returns {RangeApi} Range manipulation methods.
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

    return {
/**
         * Updates the content within the range.
         * @param {string} code - HTML string to insert
         * @param {string} [keepCache] - Pass `'cache'` to save the current range contents to the undo cache before modifying; default `''` skips caching.
         * @returns {void}
         * @example
         * range.update('<p>New content</p>');
         * range.update('<p>New content</p>', 'cache'); // Save old to cache
         */
        update ( code, keepCache = '' ) {
            if ( !validate () )   return
            refreshRange ()
            if ( keepCache === 'cache' )   cache.push ( range.cloneContents() )
            range.deleteContents ()
            range.insertNode ( _convertToDOM ( code ) )
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
         * Inserts content before the start marker.
         * @param {string} code - HTML string to insert
         * @param {string} [keepCache] - Pass `'cache'` to save the current range contents to the undo cache before prepending; default `''` skips caching.
         * @returns {void}
         * @example
         * range.prepend('<b>Before</b>');
         */
        prepend ( code, keepCache = '' ) {
            if ( !validate () )   return
            if ( keepCache === 'cache' )   cache.push ( range.cloneContents() )
            start.after ( _convertToDOM ( code ) )
        },

        /**
         * Inserts content after the end marker.
         * @param {string} code - HTML string to insert
         * @param {string} [keepCache] - Pass `'cache'` to save the current range contents to the undo cache before appending; default `''` skips caching.
         * @returns {void}
         * @example
         * range.append('<i>After</i>');
         */
        append ( code, keepCache = '' ) {
            if ( !validate () )   return
            if ( keepCache === 'cache' )   cache.push ( range.cloneContents() )
            end.before ( _convertToDOM ( code ) )
        }
}} // makeMyAPI func.



export default dim