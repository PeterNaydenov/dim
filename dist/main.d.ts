export default dim;
export type RangeMutator = (code: string, keepCache?: string) => void;
export type RangeApi = {
    /**
     * Replaces the range content with `code` (HTML string); pass `'cache'` to save current content for undo.
     */
    update: RangeMutator;
    /**
     * Clears the undo cache.
     */
    clearCache: () => void;
    /**
     * Gets the common ancestor container of the range, or `null` if the markers are orphaned.
     */
    getContext: () => Node | null;
    /**
     * `true` if the range is empty (collapsed) or the markers are orphaned.
     */
    isEmpty: () => boolean;
    /**
     * Deletes all content within the range; pass `'cache'` to save current content for undo.
     */
    delete: (keepCache?: string) => void;
    /**
     * Restores the most recently cached range content (undo).
     */
    back: () => void;
    /**
     * Inserts `code` (HTML string) before the start marker; pass `'cache'` to save current content for undo.
     */
    prepend: RangeMutator;
    /**
     * Inserts `code` (HTML string) after the end marker; pass `'cache'` to save current content for undo.
     */
    append: RangeMutator;
};
export type SetCallback = (markers: {
    start: Text;
    end: Text;
}, ...args: any[]) => string | void;
export type DimApi = {
    /**
     * Registers a new range with invisible start/end markers placed by `fn`.
     */
    set: (fn: SetCallback, ...args: any[]) => void;
    /**
     * Retrieves one or more ranges by alias, numeric index, or comma-separated names.
     */
    get: (name: string | string[]) => RangeApi | (RangeApi | undefined)[] | undefined;
    /**
     * Clears internal bookkeeping (ranges and aliases); does not remove marker nodes already inserted in the DOM.
     */
    reset: () => void;
};
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
declare function dim(): DimApi;
