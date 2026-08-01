/**
 * `code` is parsed as HTML (via a `<template>` element) and inserted into the DOM —
 * never pass untrusted/user-supplied input without sanitizing it first.
 * Accepts either an HTML string or a DOM `Node` (e.g. a `DocumentFragment`).
 * Passing anything else (`null`, `undefined`, number, boolean, object, …) throws `TypeError`
 * BEFORE any mutation, so the existing range content is preserved.
 */
type RangeMutator = (code: string | Node, keepCache?: string) => void;
type RangeApi = {
    /**
     * Replaces the range content with `code` (HTML string or Node); pass `'cache'` to save current content for undo.
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
     * Inserts `code` (HTML string or Node) at the start of the range's content area (immediately after the start marker); pass `'cache'` to save current content for undo.
     */
    prepend: RangeMutator;
    /**
     * Inserts `code` (HTML string or Node) at the end of the range's content area (immediately before the end marker); pass `'cache'` to save current content for undo.
     */
    append: RangeMutator;
    /**
     * Returns a deep clone of the range contents as a `DocumentFragment` (safe to mutate without touching the live DOM); returns `null` when markers are orphaned.
     */
    select: () => DocumentFragment | null;
    /**
     * Like `delete()` but returns the removed content as a `DocumentFragment`; pass `'cache'` to also enable undo via `back()`. The fragment is a CLONE of the removed content — node identity and event listeners added via `addEventListener` are not carried over.
     */
    extract: (keepCache?: string) => DocumentFragment | null;
    /**
     * `true` if either marker has been detached from the DOM. Silent — no warning logged.
     */
    isOrphan: () => boolean;
    /**
     * Returns the plain-text content of the range (empty string when orphaned).
     */
    toString: () => string;
};
type SetCallback = (markers: {
    start: Text;
    end: Text;
}, ...args: any[]) => string | void;
type DimApi = {
    /**
     * Registers a new range with invisible start/end markers placed by `fn`.
     */
    set: (fn: SetCallback, ...args: any[]) => void;
    /**
     * Retrieves one or more ranges by alias, numeric index, comma-separated names, or array of names/numbers.
     */
    get: (name: string | number | (string | number)[]) => RangeApi | (RangeApi | undefined)[] | undefined;
    /**
     * Selective: omit the argument to clear every range AND remove every marker still attached to the DOM; pass a name/index or an array of them to clear just those. Dropping a range removes every key that points to it — alias and numeric index alike.
     */
    reset: (names?: string | number | (string | number)[]) => void;
    /**
     * Returns all registry keys — aliases first (registration order), then numeric indexes (registration order). Aliases and indexes are deduplicated.
     */
    list: () => string[];
    /**
     * Returns only the user-named aliases, in registration order.
     */
    aliases: () => string[];
    /**
     * `true` if every requested range exists. Accepts a single key, an array, or a comma-separated string.
     */
    has: (name: string | number | (string | number)[]) => boolean;
};
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
declare function dim(): DimApi;
declare namespace dim {
    export { RangeMutator, RangeApi, SetCallback, DimApi };
}
export = dim;
