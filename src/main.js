/**
  DOM Invisible Markers (dim) 
  ==========================
  A lightweight library for creating and managing invisible markers in the DOM

  History notes:
      - Created on 2025-08-27;
 */



/**
 * Creates invisible markers in the DOM to define ranges, allowing content insertion and manipulation.
 * @returns {Object} The dim API with set, get, and reset methods
 */
function dim () {
        let 
              ranges  = {} // Numeric ranges - always added
            , aliases = {} // Named ranges - added only if set function returns name
            ;
        /**
         * Registers a new range with invisible start and end markers in the DOM.
         * @param {Function} fn - Callback function receiving {start, end} markers and any additional args
         * @param {...*} args - Additional arguments passed to the callback
         * @param {string} [fn.return] - Optional alias name for the range
         * @returns {void}
         * @example
         * d.set(({ start, end }) => {
         *   const div = document.createElement('div');
         *   div.appendChild(start);
         *   div.appendChild(end);
         *   document.body.appendChild(div);
         * }, arg1, arg2);
         */
        function set  ( fn, ...args ) {
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
         * Retrieves one or more ranges by name, numeric index, or comma-separated names.
         * @param {string|string[]} name - Range alias, numeric index ('0', '1'), comma-separated names ('a, b'), or array of names
         * @returns {Object|Object[]|undefined} The range API object(s) or undefined if not found
         * @example
         * const r = d.get('0');           // By numeric index
         * const r = d.get('myRange');     // By alias name
         * const [r1, r2] = d.get('a, b'); // Multiple by comma-separated
         * const [r1, r2] = d.get(['a', 'b']); // Multiple by array
         */
        function get ( name ) {
                    if ( name.includes(',') )   name = name.split ( ',').map ( n => n.trim() )
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
 * @param {Range} range - The DOM Range object
 * @param {Text} start - The start marker node
 * @param {Text} end - The end marker node
 * @returns {Object} The range API with manipulation methods
 * @private
 */
function makeMyAPI ( range, start, end ) {
    let cache = [];

    /**
     * Validates that the range markers are still connected to the DOM.
     * When a parent range updates its content, nested range markers get deleted from the DOM.
     * This function checks if the markers still exist in the document tree.
     * @private
     * @returns {boolean} True if markers are connected, false if removed from DOM
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
         * @param {string} [keepCache=''] - If 'cache', preserves current content in cache for undo
         * @returns {void}
         * @example
         * range.update('<p>New content</p>');
         * range.update('<p>New content</p>', 'cache'); // Save old to cache
         */
        update ( code, keepCache = '' ) {
            if ( !validate () )   return
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
                return range.collapsed
            },

        /**
         * Deletes all content within the range.
         * @param {string} [keepCache=''] - If 'cache', preserves content in cache for undo
         * @returns {void}
         * @example
         * range.delete();
         * range.delete('cache'); // Save to cache first
         */
        delete     : ( keepCache = '' ) => {
            if ( !validate () )   return
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
            let content = cache.pop ()
            if ( content ) {  
                range.deleteContents ()
                range.insertNode ( content )
            }
        },

        /**
         * Inserts content before the start marker.
         * @param {string} code - HTML string to insert
         * @param {string} [keepCache=''] - If 'cache', preserves content in cache
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
         * @param {string} [keepCache=''] - If 'cache', preserves content in cache
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