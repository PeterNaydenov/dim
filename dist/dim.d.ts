export default dim;
export type RangeMutator = (code: string, keepCache?: string) => void;
export type RangeApi = {
    /**
     * Replaces the range content with `code`; pass `'cache'` to save current content for undo.
     */
    update: RangeMutator;
    clearCache: () => void;
    getContext: () => Node | null;
    isEmpty: () => boolean;
    delete: RangeMutator;
    /**
     * Restores the most recently cached range content (undo).
     */
    back: () => void;
    prepend: RangeMutator;
    append: RangeMutator;
};
export type SetCallback = (markers: {
    start: Text;
    end: Text;
}, ...args: any[]) => string | void;
export type DimApi = {
    set: (fn: SetCallback, ...args: any[]) => void;
    get: (name: string | string[]) => RangeApi | (RangeApi | undefined)[] | undefined;
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
 * @property {RangeMutator} update  Replaces the range content with `code`; pass `'cache'` to save current content for undo.
 * @property {() => void} clearCache
 * @property {() => Node | null} getContext
 * @property {() => boolean} isEmpty
 * @property {RangeMutator} delete
 * @property {() => void} back  Restores the most recently cached range content (undo).
 * @property {RangeMutator} prepend
 * @property {RangeMutator} append
 */
/**
 * @callback SetCallback
 * @param {{ start: Text, end: Text }} markers Invisibility markers to place in the DOM.
 * @param {...*} args Additional arguments forwarded by the caller.
 * @returns {string|void} Return a string to register the range under that alias.
 */
/**
 * @typedef {Object} DimApi
 * @property {(fn: SetCallback, ...args: any[]) => void} set
 * @property {(name: string | string[]) => RangeApi | (RangeApi | undefined)[] | undefined} get
 * @property {() => void} reset
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
