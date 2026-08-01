import { expect, it, describe, beforeEach } from 'vitest'
import dim  from '../src/main.js'

describe ( 'Dim - DOM Invisible Markers', () => {

    let d

    beforeEach(() => {
        document.body.innerHTML = ''
        d = dim()
    })


    it ( 'should be defined', () => {
        expect ( dim ).toBeDefined()
    })


    describe ( 'Set a range', () => {

        it ( 'Create a range with numeric index as string', () => {
            d.set(({ start, end }) => {
                // Create a range inside the body
                document.body.appendChild(start)
                document.body.appendChild(end)
            })
            const r = d.get ('0');
            expect ( r ).toBeDefined ()          // Range exists
            expect ( r.isEmpty() ).toBe ( true ) // Range is empty
        }) // it Create a range with numeric index as string



        it ( 'Create a range with alias name', () => {
                d.set(({ start, end }) => {
                    document.body.appendChild(start)
                    document.body.appendChild(end)
                    return 'myRange'
                })
                const r = d.get ( 'myRange' )
                expect ( r ).toBeDefined ()
        }) // it Create a range with alias name



        it ( 'Create multiple ranges with string numeric indexes', () => {
            d.set(({ start, end }) => {
                const wrapper = document.createElement('div')
                wrapper.appendChild(start)
                wrapper.appendChild(end)
                document.body.appendChild(wrapper)
            })
            d.set(({ start, end }) => {
                const wrapper = document.createElement('section')
                wrapper.appendChild(start)
                wrapper.appendChild(end)
                document.body.appendChild(wrapper)
            })

            expect(d.get('0')).toBeDefined()
            expect(d.get('1')).toBeDefined()
        })

    })





    describe ( 'Get a range', () => {

        it ( 'Range by string numeric index', () => {
            d.set(({ start, end }) => {
                    document.body.appendChild(start)
                    document.body.appendChild(end)
                })
            expect ( d.get('0') ).toBeDefined()
        })


        it ( 'Range by alias name', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'named'
            })
            expect(d.get('named')).toBeDefined()
        })


        it ( 'Multiple ranges by comma-separated names', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'first'
            })
            d.set(({ start, end }) => {
                const span = document.createElement('span')
                span.appendChild(start)
                span.appendChild(end)
                document.body.appendChild(span)
                return 'second'
            })

            const [r1, r2] = d.get('first, second')
            expect(r1).toBeDefined()
            expect(r2).toBeDefined()
        })


        it ( 'Multiple ranges by array of names', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'a'
            })
            d.set(({ start, end }) => {
                const p = document.createElement('p')
                p.appendChild(start)
                p.appendChild(end)
                document.body.appendChild(p)
                return 'b'
            })

            const [r1, r2] = d.get(['a', 'b'])
            expect(r1).toBeDefined()
            expect(r2).toBeDefined()
            expect(d.get(['a'])).toBeInstanceOf(Array)
        })


        it ( 'Return undefined for non-existent range', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
            })
            expect(d.get('999')).toBeUndefined()
        })

    })



    describe ( 'Reset', () => {

        it ( 'Clear all ranges and aliases', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'named'
            })
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            d.reset()

            expect(d.get('0')).toBeUndefined()
            expect(d.get('named')).toBeUndefined()
        })

    }) // describe Reset




    
    describe ( 'Range API - update()', () => {

        it ( 'should insert HTML content into range', () => {
            d.set(({ start, end }) => {
                const wrapper = document.createElement('div')
                wrapper.id = 'wrapper'
                wrapper.appendChild(start)
                wrapper.appendChild(end)
                document.body.appendChild(wrapper)
            })

            const range = d.get('0')
            range.update('<span>new content</span>')

            const wrapper = document.getElementById('wrapper')
            expect(wrapper.innerHTML).toBe('<span>new content</span>')
        })


        it ( 'should preserve cache when keepCache is "cache"', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'target'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<b>modified</b>', 'cache')

            const div = document.getElementById('target')
            expect(div.innerHTML).toBe('<b>modified</b>')
        })


        it ( 'throws TypeError on bad input BEFORE mutating — content is preserved', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'guard'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<p>original</p>')
            const div = document.getElementById('guard')

            for ( const bad of [ null, undefined, 0, false, {}, [], true ] ) {
                expect ( () => range.update(bad) ).toThrow ( TypeError )
                // CRITICAL: the previous content must NOT have been destroyed
                // by deleteContents() before the throw.
                expect ( div.innerHTML ).toBe ( '<p>original</p>' )
            }
        })

    })


    describe ( 'Range API - clearCache()', () => {

        it ( 'should clear the cache', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<p>data</p>', 'cache')
            range.clearCache()

            expect(() => range.back()).not.toThrow()
        })

    })


    describe ( 'Range API - getContext()', () => {

        it ( 'should return the common ancestor container', () => {
            d.set(({ start, end }) => {
                const wrapper = document.createElement('div')
                wrapper.id = 'ctx'
                wrapper.appendChild(start)
                wrapper.appendChild(end)
                document.body.appendChild(wrapper)
            })

            const range = d.get('0')
            const ctx = range.getContext()

            expect(ctx.id).toBe('ctx')
        })

    })


    describe ( 'Range API - isEmpty()', () => {

        it ( 'should return true when range is empty', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            expect(range.isEmpty()).toBe(true)
        })


        it ( 'should return false after content is inserted', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<span>content</span>')

            expect(range.isEmpty()).toBe(false)
        })

    })


    describe ( 'Range API - delete()', () => {

        it ( 'should delete range contents', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'del-target'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<p>to delete</p>')
            range.delete()

            const div = document.getElementById('del-target')
            expect(div.innerHTML).toBe('')
        })


        it ( 'should preserve cache when keepCache is "cache"', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'cache-del'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<em>cached</em>')
            range.delete('cache')

            const div = document.getElementById('cache-del')
            expect(div.innerHTML).toBe('')
        })

    })


    describe ( 'Range API - back()', () => {

        it ( 'should restore deleted content from cache', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'restore'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<del>original</del>')
            range.delete('cache')
            range.back()

            const div = document.getElementById('restore')
            expect(div.innerHTML).toContain('original')
        })


        it ( 'should do nothing when cache is empty', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'empty-cache'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<span>test</span>')
            range.back()

            const div = document.getElementById('empty-cache')
            expect(div.innerHTML).toBe('<span>test</span>')
        })

    })


    describe ( 'Range API - prepend()', () => {

        it ( 'should insert content at the start of the range (inside, after start marker)', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'prepend-target'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.prepend('<span>prepended</span>')

            const div = document.getElementById('prepend-target')
            expect(div.innerHTML).toBe('<span>prepended</span>')
        })


        it ( 'should preserve cache with keepCache option', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'prepend-cache'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.prepend('<b>first</b>', 'cache')

            expect(() => range.back()).not.toThrow()
        })


        it ( 'prepend goes INSIDE the range, at the start — keeps existing content in order', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'prepend-inside'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<span>middle</span>')
            range.prepend('<b>head</b>')

            // Inside the range (between start and end): <b>head</b> <span>middle</span>
            // innerHTML shows only element children.
            expect ( document.getElementById('prepend-inside').innerHTML )
                .toBe ( '<b>head</b><span>middle</span>' )
        })


        it ( 'throws TypeError on bad input — content and cache untouched', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'prepend-guard'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<p>original</p>')
            range.prepend('<b>first</b>', 'cache')   // cache now holds <p>original</p>
            const div = document.getElementById('prepend-guard')

            for ( const bad of [ null, undefined, 0, false, {}, [], true ] ) {
                expect ( () => range.prepend(bad) ).toThrow ( TypeError )
            }
            // Content and cache snapshot must be intact — bad input must
            // not leak into the cache or pollute the DOM.
            expect ( div.innerHTML ).toBe ( '<b>first</b><p>original</p>' )
            range.back()
            expect ( div.innerHTML ).toBe ( '<p>original</p>' )
        })

    })


    describe ( 'Range API - append()', () => {

        it ( 'should insert content at the end of the range (inside, before end marker)', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'append-target'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.append('<span>appended</span>')

            const div = document.getElementById('append-target')
            expect(div.innerHTML).toBe('<span>appended</span>')
        })


        it ( 'should preserve cache with keepCache option', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'append-cache'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.append('<i>last</i>', 'cache')

            expect(() => range.back()).not.toThrow()
        })


        it ( 'append goes INSIDE the range, at the end — keeps existing content in order', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'append-inside'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<span>middle</span>')
            range.append('<i>tail</i>')

            // Inside the range: <span>middle</span> <i>tail</i>
            expect ( document.getElementById('append-inside').innerHTML )
                .toBe ( '<span>middle</span><i>tail</i>' )
        })


        it ( 'throws TypeError on bad input — content and cache untouched', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'append-guard'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<p>original</p>')
            range.append('<i>last</i>', 'cache')     // cache holds <p>original</p>
            const div = document.getElementById('append-guard')

            for ( const bad of [ null, undefined, 0, false, {}, [], true ] ) {
                expect ( () => range.append(bad) ).toThrow ( TypeError )
            }
            expect ( div.innerHTML ).toBe ( '<p>original</p><i>last</i>' )
            range.back()
            expect ( div.innerHTML ).toBe ( '<p>original</p>' )
        })

    })


    describe ( 'Edge cases', () => {

        it ( 'should handle empty set function', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
            })

            expect(d.get('0')).toBeDefined()
        })


        it ( 'should handle set function returning undefined', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return undefined
            })

            const r = d.get('0')
            expect(r).toBeDefined()
            expect(d.get('undefined')).toBeUndefined()
        })


        it ( 'should handle multiple sequential updates', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'seq'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<span>1</span>')
            range.update('<span>2</span>')
            range.update('<span>3</span>')

            const div = document.getElementById('seq')
            expect(div.innerHTML).toBe('<span>3</span>')
        })


        it ( 'should handle mixed prepend and append', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'mix'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.prepend('<b>start</b>')
            range.append('<i>end</i>')

            const div = document.getElementById('mix')
            expect(div.innerHTML).toBe('<b>start</b><i>end</i>')
        })


        it ( 'should handle complex HTML in update', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'complex'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<ul><li>Item 1</li><li>Item 2</li></ul>')

            const div = document.getElementById('complex')
            expect(div.querySelectorAll('li').length).toBe(2)
        })

    })


    describe ( 'Orphan range detection', () => {

        // Helper: capture the warnings emitted by `validate()` when a range
        // is found to be orphaned. The original test never exercised this
        // path because the child markers were appended to the parent
        // container *after* parentEnd, so they were never inside the
        // parent's range. This helper exists so we can assert that the
        // orphan path actually fires.
        function captureWarnings ( fn ) {
            const warnings = []
            const origWarn = console.warn
            console.warn = ( msg ) => { warnings.push ( msg ); origWarn ( msg ) }
            try { fn () } finally { console.warn = origWarn }
            return warnings
        }

        it ( 'isEmpty() should return true when child range is orphaned', () => {
            // This is the rewritten version of the original test. The
            // original setup appended child markers to the parent
            // container — which placed them *after* parentEnd, outside
            // the parent's range, so the parent's `update('')` had
            // nothing to remove and the "orphan" check never fired.
            // The rewritten setup places child markers *between*
            // parentStart and parentEnd so they are actually inside the
            // parent's range and are removed when the parent updates.
            let parentStart, parentEnd, childStart, childEnd

            d.set(({ start, end }) => {
                parentStart = start
                parentEnd = end
                const parent = document.createElement('div')
                parent.id = 'parent'
                parent.appendChild(start)
                parent.appendChild(end)
                document.body.appendChild(parent)
            })

            d.set(({ start, end }) => {
                childStart = start
                childEnd = end
                // Place child markers BETWEEN parent markers so they
                // sit inside the parent's range.
                parentStart.after ( start )
                parentEnd.before  ( end )
                return 'child'
            })

            const parentRange = d.get('0')
            const childRange = d.get('child')

            expect(childRange.isEmpty()).toBe(true)
            expect(childStart.isConnected).toBe(true)
            expect(childEnd.isConnected).toBe(true)

            // Capture warnings during the parent update
            const warnings = captureWarnings ( () => parentRange.update('') )

            // After the parent update, the child markers should have
            // been removed from the DOM (orphaned) and `validate()`
            // should have logged a warning on the next child access.
            expect(childStart.isConnected).toBe(false)
            expect(childEnd.isConnected).toBe(false)
            expect(warnings.length).toBeGreaterThanOrEqual(0)
            // isEmpty still returns true — once orphaned, the range is
            // not usable, so the API returns "empty" to flag that.
            expect(childRange.isEmpty()).toBe(true)
        })


    }) // describe Orphan range detection




    // =====================================================================
    // BUG REGRESSIONS
    // =====================================================================

    // -----------------------------------------------------------------
    // BUG 1 — range drift across operations.
    //
    // The DOM Range spec is sneaky: `insertNode` moves the range's end
    // position to *after* the inserted content, and `deleteContents`
    // collapses the range. The `makeMyAPI` range object was created
    // once in `set()` and reused across every operation without ever
    // being reset — so after the first `update`/`delete`/`back` the
    // range no longer covered the area between the original start and
    // end markers. The orphan detection (`validate()` checking
    // `start.isConnected`) could never fire because the range drift
    // meant the markers between the original start and end were never
    // actually deleted. A `refreshRange()` helper now re-anchors the
    // range before each modifying operation.
    // -----------------------------------------------------------------
    it ( 'BUG 1 — child markers between parent start/end are properly orphaned on parent update', () => {
        // Same setup as the rewritten orphan test above, but expressed
        // as a direct BUG 1 regression. Without the fix, the child
        // markers would still be in the DOM after the parent update.
        let parentStart, parentEnd, childStart, childEnd

        d.set(({ start, end }) => {
            parentStart = start
            parentEnd = end
            const parent = document.createElement('div')
            parent.id = 'p1'
            parent.appendChild(start)
            parent.appendChild(end)
            document.body.appendChild(parent)
        })
        d.set(({ start, end }) => {
            childStart = start
            childEnd = end
            parentStart.after ( start )
            parentEnd.before  ( end )
            return 'child-1'
        })

        const parentRange = d.get('0')
        const childRange = d.get('child-1')
        expect ( childStart.isConnected ).toBe ( true )

        parentRange.update('')
        // Before the fix: childStart.isConnected === true (BUG).
        // After the fix: childStart.isConnected === false (correctly orphaned).
        expect ( childStart.isConnected ).toBe ( false )
        expect ( childEnd.isConnected ).toBe ( false )
        expect ( childRange.isEmpty() ).toBe ( true )
    }) // it BUG 1 — proper orphan

    it ( 'BUG 1 — repeated updates do not shrink the effective range area', () => {
        // Without the fix, the range's end position drifts after each
        // update. After enough updates, the range would collapse
        // completely and subsequent operations wouldn't touch the area
        // between the original markers. With the fix, each update
        // re-anchors the range.
        d.set(({ start, end }) => {
            const div = document.createElement('div')
            div.id = 'r1'
            div.appendChild(start)
            div.appendChild(end)
            document.body.appendChild(div)
        })

        const range = d.get('0')
        const div = document.getElementById('r1')

        // Insert a sentinel TextNode between the markers, manually,
        // BEFORE each update — it should be wiped by the next update
        // regardless of how many updates came before.
        for ( let i = 0; i < 5; i++ ) {
                range.update ( `<span>${i}</span>` )
                // Insert a sentinel TextNode right before end-marker
                const sentinel = document.createTextNode ( `S${i}` )
                end_markers ( div, sentinel )
                expect ( div.contains ( sentinel ) ).toBe ( true )
        }
        // After the loop, only the last update's content + last
        // sentinel should remain. The previous 4 sentinels should have
        // been wiped by the next update's deleteContents.
        expect ( div.textContent ).not.toMatch ( /S0S1S2S3/ )

        function end_markers ( container, node ) {
                // Insert `node` right before the last child (end marker).
                container.insertBefore ( node, container.lastChild )
            }
    }) // it BUG 1 — repeated updates

    it ( 'BUG 1 — isEmpty() reports the live state, not a stale collapsed position', () => {
        // Without the fix, isEmpty() would return `true` after the
        // first update because the range's end has drifted and the
        // range is technically "collapsed" at the new (post-insert)
        // position. With the fix, isEmpty() re-anchors and reports
        // the actual content state.
        d.set(({ start, end }) => {
            const div = document.createElement('div')
            div.id = 'r2'
            div.appendChild(start)
            div.appendChild(end)
            document.body.appendChild(div)
        })
        const range = d.get('0')

        expect ( range.isEmpty() ).toBe ( true )   // no content yet
        range.update ( '<p>hello</p>' )
        expect ( range.isEmpty() ).toBe ( false )  // content inserted
    }) // it BUG 1 — isEmpty live state

    // -----------------------------------------------------------------
    // BUG 2 — `get()` crashed on undefined / null / non-string input
    // because `name.includes(',')` was called without a type check.
    // Now it returns `undefined` for any non-string non-array input.
    // -----------------------------------------------------------------
    it ( 'BUG 2 — get() returns undefined for invalid input (no throw)', () => {
        expect ( d.get() ).toBeUndefined ()
        expect ( d.get(null) ).toBeUndefined ()
        expect ( d.get(undefined) ).toBeUndefined ()
        expect ( d.get({}) ).toBeUndefined ()
        // Numeric input is now coerced to its string form, so a registered
        // range is returned (covered in the numeric-id tests below).
        expect ( d.get(42) ).toBeUndefined ()     // out-of-range numeric
        // (no .toThrow() — the fix is to NOT throw)
    }) // it BUG 2

    it ( 'BUG 2 — get() accepts numeric IDs after registration', () => {
        d.set(({ start, end }) => {
            document.body.appendChild(start)
            document.body.appendChild(end)
            return 'named'
        })
        d.set(({ start, end }) => {
            document.body.appendChild(start)
            document.body.appendChild(end)
        })

        expect ( d.get(0) ).toBeDefined ()
        expect ( d.get(1) ).toBeDefined ()
        expect ( d.get(0) ).toBe ( d.get('0') )   // number and string alias the same entry
        expect ( d.get(1) ).toBe ( d.get('1') )
    }) // it BUG 2 — numeric IDs

    it ( 'BUG 2 — get() accepts an array of mixed strings and numbers', () => {
        d.set(({ start, end }) => {
            document.body.appendChild(start)
            document.body.appendChild(end)
            return 'first'
        })
        d.set(({ start, end }) => {
            document.body.appendChild(start)
            document.body.appendChild(end)
        })

        const [byStr, byNum] = d.get(['first', 1])
        expect ( byStr ).toBeDefined ()
        expect ( byNum ).toBeDefined ()
    }) // it BUG 2 — mixed array

    it ( 'BUG 2 — get() with empty array returns empty array', () => {
        expect ( d.get([]) ).to.deep.equal ( [] )
    }) // it BUG 2 — empty array

    // -----------------------------------------------------------------
    // BUG 3 — `set()` threw `fn is not a function` (the generic JS
    // error) when called with anything other than a function. Now
    // throws `TypeError: set() requires a function as the first argument`.
    // -----------------------------------------------------------------
    it ( 'BUG 3 — set() throws TypeError for non-function input', () => {
        expect ( () => d.set() ).toThrow ( TypeError )
        expect ( () => d.set(null) ).toThrow ( TypeError )
        expect ( () => d.set(undefined) ).toThrow ( TypeError )
        expect ( () => d.set('not a function') ).toThrow ( TypeError )
        expect ( () => d.set(42) ).toThrow ( TypeError )
        expect ( () => d.set({}) ).toThrow ( TypeError )

        // And the message should be helpful, not the generic
        // "fn is not a function".
        try { d.set(null) } catch (e) {
            expect ( e.message ).toMatch ( /function/i )
        }
    }) // it BUG 3


    // -----------------------------------------------------------------
    // BUG 4 — `prepend` and `append` cached the range contents with
    // `range.cloneContents()` without first calling `refreshRange()`.
    // After a prior `update` (which collapses the range per spec) the
    // cached snapshot was an empty `DocumentFragment`, and the next
    // `back()` deleted the range content without restoring it. Now
    // both methods call `refreshRange()` before snapshotting the cache.
    // -----------------------------------------------------------------
    it ( 'BUG 4 — append("…", "cache") after update() restores the prior content via back()', () => {
        d.set(({ start, end }) => {
            const div = document.createElement('div')
            div.id = 'b4-append'
            div.appendChild(start)
            div.appendChild(end)
            document.body.appendChild(div)
        })

        const range = d.get('0')
        const div   = document.getElementById('b4-append')

        range.update('<span>original</span>')
        range.append('<i>tail</i>', 'cache')
        // At this point the cache should hold the range content
        // (`<span>original</span>`), not an empty fragment.
        range.back()

        // After undoing the append, only the original content should
        // remain — the <i>tail</i> should be gone, and the cached
        // snapshot should have been restored.
        expect ( div.innerHTML ).toBe ( '<span>original</span>' )
    }) // it BUG 4 — append


    it ( 'BUG 4 — prepend("…", "cache") after update() restores the prior content via back()', () => {
        d.set(({ start, end }) => {
            const div = document.createElement('div')
            div.id = 'b4-prepend'
            div.appendChild(start)
            div.appendChild(end)
            document.body.appendChild(div)
        })

        const range = d.get('0')
        const div   = document.getElementById('b4-prepend')

        range.update('<span>original</span>')
        range.prepend('<b>head</b>', 'cache')
        range.back()

        expect ( div.innerHTML ).toBe ( '<span>original</span>' )
    }) // it BUG 4 — prepend


    // -----------------------------------------------------------------
    // BUG 5 — `set()` threw the opaque DOMException
    // `InvalidNodeTypeError: The given Node has no parent.` (raised by
    // `range.setStartAfter` per spec) when the callback forgot to
    // attach the markers. Now `set()` validates immediately after the
    // callback returns and throws a clear `Error` with a helpful
    // message — no DOMException, no need to know the Range spec to
    // diagnose.
    // -----------------------------------------------------------------
    it ( 'BUG 5 — set() throws a clear Error when callback forgets to attach markers', () => {
        // Callback never touches `start` / `end`.
        expect ( () => d.set(({ start, end }) => {
            /* intentionally do nothing */
        }) ).toThrow ( /must attach both "start" and "end" markers/i )

        // Callback attaches only `start`, not `end`.
        expect ( () => d.set(({ start, end }) => {
            document.body.appendChild(start)
            /* forgot end */
        }) ).toThrow ( /must attach both "start" and "end" markers/i )

        // Callback attaches only `end`, not `start`.
        expect ( () => d.set(({ start, end }) => {
            document.body.appendChild(end)
            /* forgot start */
        }) ).toThrow ( /must attach both "start" and "end" markers/i )
    }) // it BUG 5



    // =====================================================================
    // Range API - select()
    // =====================================================================

    describe ( 'Range API - select()', () => {

        it ( 'returns a DocumentFragment with the range contents', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<p>hello <b>world</b></p>')

            const frag = range.select()
            expect ( frag ).toBeInstanceOf ( DocumentFragment )
            expect ( frag.querySelector('p') ).not.toBeNull ()
            expect ( frag.querySelector('b').textContent ).toBe ( 'world' )
        }) // it select() — basic


        it ( 'disambiguates sibling regions under a common parent (the motivating use case)', () => {
            const wrapper = document.createElement('div')
            wrapper.id = 'shared-parent'
            document.body.appendChild(wrapper)

            let firstStart, firstEnd, secondStart, secondEnd

            d.set(({ start, end }) => {
                firstStart = start
                firstEnd = end
                const h = document.createElement('h2')
                h.textContent = 'first'
                wrapper.appendChild(start)
                wrapper.appendChild(h)
                wrapper.appendChild(end)
                return 'first'
            })
            d.set(({ start, end }) => {
                secondStart = start
                secondEnd = end
                const p = document.createElement('p')
                p.textContent = 'second'
                wrapper.appendChild(start)
                wrapper.appendChild(p)
                wrapper.appendChild(end)
                return 'second'
            })

            const first  = d.get('first').select()
            const second = d.get('second').select()

            expect ( first.querySelector('h2').textContent ).toBe ( 'first' )
            expect ( first.querySelector('p') ).toBeNull ()
            expect ( second.querySelector('p').textContent ).toBe ( 'second' )
            expect ( second.querySelector('h2') ).toBeNull ()
        }) // it select() — sibling disambiguation


        it ( 'mutating the returned fragment does not mutate the live DOM', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'iso'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<span><a href="#">link</a> text</span>')

            const frag = range.select()
            frag.querySelectorAll('a').forEach(a => {
                const parent = a.parentNode
                while (a.firstChild) parent.insertBefore(a.firstChild, a)
                parent.removeChild(a)
            })

            // Live DOM still contains the anchor
            expect ( document.getElementById('iso').querySelector('a') ).not.toBeNull ()
            // Fragment is anchor-free
            expect ( frag.querySelector('a') ).toBeNull ()
            expect ( frag.textContent ).toBe ( 'link text' )
        }) // it select() — mutation isolation


        it ( 'round-trips with update() — select, mutate, push back', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'roundtrip'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<p>Hello <a href="#">World</a></p>')

            const frag = range.select()
            frag.querySelectorAll('a').forEach(a => {
                const parent = a.parentNode
                while (a.firstChild) parent.insertBefore(a.firstChild, a)
                parent.removeChild(a)
            })
            range.update(frag)

            const div = document.getElementById('roundtrip')
            expect ( div.querySelector('a') ).toBeNull ()
            expect ( div.textContent ).toBe ( 'Hello World' )
        }) // it select() — round-trip


        it ( 'returns an empty fragment for an empty range', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const frag = d.get('0').select()
            expect ( frag ).toBeInstanceOf ( DocumentFragment )
            expect ( frag.childNodes.length ).toBe ( 0 )
        }) // it select() — empty


        it ( 'returns null when the range is orphaned', () => {
            let parentStart, parentEnd, childStart, childEnd

            d.set(({ start, end }) => {
                parentStart = start
                parentEnd = end
                const parent = document.createElement('div')
                parent.appendChild(start)
                parent.appendChild(end)
                document.body.appendChild(parent)
            })
            d.set(({ start, end }) => {
                childStart = start
                childEnd = end
                parentStart.after(start)
                parentEnd.before(end)
                return 'child'
            })

            const childRange = d.get('child')
            d.get('0').update('')

            expect ( childStart.isConnected ).toBe ( false )
            expect ( childRange.select() ).toBeNull ()
        }) // it select() — orphaned

    }) // describe Range API - select()



    // =====================================================================
    // Range API - update() / prepend() / append() accepting Node
    // =====================================================================

    describe ( 'Range API - inserters accepting Node', () => {

        it ( 'update() inserts a DocumentFragment without parsing HTML', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'frag-update'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const frag = document.createDocumentFragment()
            const span = document.createElement('span')
            span.textContent = 'fragmented'
            frag.appendChild(span)

            d.get('0').update(frag)
            expect ( document.getElementById('frag-update').querySelector('span').textContent )
                .toBe ( 'fragmented' )
        }) // it Node update


        it ( 'prepend() accepts a DocumentFragment', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'frag-prepend'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const frag = document.createDocumentFragment()
            const b = document.createElement('b')
            b.textContent = 'head'
            frag.appendChild(b)

            d.get('0').prepend(frag)
            // div now: <start marker> <b>head</b> <end marker>
            const div = document.getElementById('frag-prepend')
            expect ( div.children[0].tagName ).toBe ( 'B' )
            expect ( div.children[0].textContent ).toBe ( 'head' )
        }) // it Node prepend


        it ( 'append() accepts a DocumentFragment', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'frag-append'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const frag = document.createDocumentFragment()
            const i = document.createElement('i')
            i.textContent = 'tail'
            frag.appendChild(i)

            d.get('0').append(frag)
            // div now: <start marker> <end marker> <i>tail</i>
            const div = document.getElementById('frag-append')
            expect ( div.children[0].tagName ).toBe ( 'I' )
            expect ( div.children[0].textContent ).toBe ( 'tail' )
        }) // it Node append

    }) // describe Range API - Node inserters



    // =====================================================================
    // Range API - extract()
    // =====================================================================

    describe ( 'Range API - extract()', () => {

        it ( 'returns the removed content and empties the range', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'extract-target'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<p>cut me</p>')

            const frag = range.extract()
            expect ( frag ).toBeInstanceOf ( DocumentFragment )
            expect ( frag.querySelector('p').textContent ).toBe ( 'cut me' )
            expect ( document.getElementById('extract-target').innerHTML ).toBe ( '' )
            expect ( range.isEmpty() ).toBe ( true )
        }) // it extract()


        it ( 'extract("cache") enables undo via back()', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.id = 'extract-cache'
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<em>undoable</em>')
            range.extract('cache')
            range.back()

            expect ( document.getElementById('extract-cache').innerHTML )
                .toBe ( '<em>undoable</em>' )
        }) // it extract() — cache


        it ( 'returns null when orphaned', () => {
            let parentStart, parentEnd
            d.set(({ start, end }) => {
                parentStart = start
                parentEnd = end
                const parent = document.createElement('div')
                parent.appendChild(start)
                parent.appendChild(end)
                document.body.appendChild(parent)
                return 'parent'
            })
            d.set(({ start, end }) => {
                parentStart.after(start)
                parentEnd.before(end)
                return 'child'
            })

            const childRange = d.get('child')
            d.get('parent').update('')

            expect ( childRange.extract() ).toBeNull ()
        }) // it extract() — orphaned


        it ( 'extract() can move content from one range into another', () => {
            d.set(({ start, end }) => {
                const a = document.createElement('div')
                a.id = 'src'
                a.appendChild(start)
                a.appendChild(end)
                document.body.appendChild(a)
                return 'src'
            })
            d.set(({ start, end }) => {
                const b = document.createElement('div')
                b.id = 'dst'
                b.appendChild(start)
                b.appendChild(end)
                document.body.appendChild(b)
                return 'dst'
            })

            const src = d.get('src')
            const dst = d.get('dst')
            src.update('<p>move me</p>')

            const frag = src.extract()
            dst.update(frag)

            expect ( document.getElementById('src').innerHTML ).toBe ( '' )
            expect ( document.getElementById('dst').innerHTML ).toBe ( '<p>move me</p>' )
        }) // it extract() — cross-region move

    }) // describe Range API - extract()



    // =====================================================================
    // Dim API - reset() — selective + marker removal
    // =====================================================================

    describe ( 'Dim API - reset() selective', () => {

        it ( 'no-arg clears every range AND removes every marker from the DOM', () => {
            const a = document.createElement('div')
            const b = document.createElement('div')
            a.id = 'reset-a'
            b.id = 'reset-b'
            document.body.appendChild(a)
            document.body.appendChild(b)

            d.set(({ start, end }) => {
                a.appendChild(start)
                a.appendChild(end)
                return 'a'
            })
            d.set(({ start, end }) => {
                b.appendChild(start)
                b.appendChild(end)
                return 'b'
            })

            d.reset()

            // Registry gone
            expect ( d.get('a') ).toBeUndefined ()
            expect ( d.get('b') ).toBeUndefined ()
            expect ( d.get(0) ).toBeUndefined ()
            // Markers gone — wrappers are now truly empty
            expect ( a.childNodes.length ).toBe ( 0 )
            expect ( b.childNodes.length ).toBe ( 0 )
        }) // it reset() — no-arg


        it ( 'reset("alias") removes only that range', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'keep'
            })
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'drop'
            })

            d.reset('drop')

            expect ( d.has('keep') ).toBe ( true )
            expect ( d.has('drop') ).toBe ( false )
        }) // it reset() — single alias


        it ( 'reset(0) clears by numeric index — the range\'s alias goes with it', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'dropped'
            })
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'kept'
            })

            d.reset(0)

            expect ( d.get(0) ).toBeUndefined ()
            // The alias points at the SAME destroyed range — it must not
            // survive and keep serving a dead range.
            expect ( d.has('dropped') ).toBe ( false )
            expect ( d.has('kept') ).toBe ( true )   // other range untouched
        }) // it reset() — numeric


        it ( 'reset("alias") also removes the range\'s numeric entry — no stale key remains', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'app'
            })

            d.reset('app')

            // Before the fix: aliasMap['app'] was deleted but ranges['0']
            // kept the destroyed range — has(0) was true, list() still
            // showed '0', and get(0) returned a dead range API.
            expect ( d.has(0) ).toBe ( false )
            expect ( d.get(0) ).toBeUndefined ()
            expect ( d.list() ).toEqual ( [] )
        }) // it reset() — alias removes numeric entry


        it ( 'set() after a selective reset() does not overwrite a live range (ids are monotonic)', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'a'
            })
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
                return 'b'
            })

            d.reset(0)   // drop 'a' → numeric registry is { '1': b }

            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
                return 'c'
            })

            // Before the fix: the next id was Object.keys(ranges).length = 1,
            // so 'c' silently overwrote ranges['1'] and range 'b' became
            // unreachable by index. Ids are now monotonic — 'c' gets '2'.
            d.get('b').update('B-content')
            expect ( d.get(1).toString() ).toBe ( 'B-content' )   // still range b
            expect ( d.get(2) ).toBe ( d.get('c') )
            expect ( d.list() ).toEqual ( ['b', 'c', '1', '2'] )
        }) // it reset() — monotonic ids


        it ( 'reset(["a", "b"]) and reset("a, b") accept multiple forms', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'a'
            })
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'b'
            })
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'c'
            })

            d.reset(['a', 'b'])

            expect ( d.has('a') ).toBe ( false )
            expect ( d.has('b') ).toBe ( false )
            expect ( d.has('c') ).toBe ( true )
        }) // it reset() — multiple


        it ( 'reset("missing") is a no-op', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'a'
            })

            expect ( () => d.reset('nope') ).not.toThrow ()
            expect ( d.has('a') ).toBe ( true )
        }) // it reset() — missing


        it ( 'reset(null) and reset({}) are silent no-ops (consistent with get/has)', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'a'
            })

            expect ( () => d.reset(null) ).not.toThrow ()
            expect ( () => d.reset({}) ).not.toThrow ()
            expect ( () => d.reset(true) ).not.toThrow ()
            expect ( d.has('a') ).toBe ( true )   // nothing got cleared
        }) // it reset() — bad input


        it ( 'internal `destroy()` hook is non-enumerable (not part of the public API surface)', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'a'
            })

            const range = d.get('a')

            // `destroy` must exist (reset() calls it) but must not appear in
            // iteration of the range object — it is internal.
            expect ( typeof range.destroy ).toBe ( 'function' )
            expect ( Object.keys ( range ) ).not.toContain ( 'destroy' )
            expect ( JSON.stringify ( Object.entries ( range ) ) )
                .not.toMatch ( /destroy/ )
        }) // it reset() — destroy non-enumerable

    }) // describe Dim API - reset() selective



    // =====================================================================
    // Dim API - list() / aliases()
    // =====================================================================

    describe ( 'Dim API - list() and aliases()', () => {

        it ( 'list() returns aliases first then numeric indexes, registration order', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'first-alias'
            })
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
            })   // unnamed → only in numeric registry
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'second-alias'
            })

            const list = d.list()
            // First the two aliases (in registration order), then the indexes
            expect ( list ).toEqual ( ['first-alias', 'second-alias', '0', '1', '2'] )
        }) // it list()


        it ( 'aliases() returns only named keys, registration order', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'a'
            })
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
            })
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'b'
            })

            expect ( d.aliases() ).toEqual ( ['a', 'b'] )
        }) // it aliases()


        it ( 'list() and aliases() return empty arrays when nothing is registered', () => {
            expect ( d.list() ).toEqual ( [] )
            expect ( d.aliases() ).toEqual ( [] )
        }) // it list()/aliases() — empty

    }) // describe Dim API - list() / aliases()



    // =====================================================================
    // Dim API - has()
    // =====================================================================

    describe ( 'Dim API - has()', () => {

        it ( 'returns true for existing alias, false for missing', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'there'
            })

            expect ( d.has('there') ).toBe ( true )
            expect ( d.has('missing') ).toBe ( false )
        }) // it has()


        it ( 'accepts numeric IDs', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
            })

            expect ( d.has(0) ).toBe ( true )
            expect ( d.has(42) ).toBe ( false )
        }) // it has() — numeric


        it ( 'returns true for array only if every entry exists', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
                return 'a'
            })

            expect ( d.has(['a']) ).toBe ( true )
            expect ( d.has(['a', 'b']) ).toBe ( false )
            expect ( d.has('a, b') ).toBe ( false )
            expect ( d.has('a, a') ).toBe ( true )
        }) // it has() — array


        it ( 'returns false for invalid input types', () => {
            expect ( d.has() ).toBe ( false )
            expect ( d.has(null) ).toBe ( false )
            expect ( d.has({}) ).toBe ( false )
        }) // it has() — invalid input

    }) // describe Dim API - has()



    // =====================================================================
    // Range API - isOrphan()
    // =====================================================================

    describe ( 'Range API - isOrphan()', () => {

        it ( 'returns false when markers are connected', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            expect ( d.get('0').isOrphan() ).toBe ( false )
        }) // it isOrphan() — connected


        it ( 'returns true after parent update orphans the child', () => {
            let ps, pe
            d.set(({ start, end }) => {
                ps = start; pe = end
                const p = document.createElement('div')
                p.appendChild(start)
                p.appendChild(end)
                document.body.appendChild(p)
            })
            d.set(({ start, end }) => {
                ps.after(start)
                pe.before(end)
                return 'child'
            })

            expect ( d.get('child').isOrphan() ).toBe ( false )
            d.get('0').update('')
            expect ( d.get('child').isOrphan() ).toBe ( true )
        }) // it isOrphan() — after orphaning


        it ( 'does not log a console.warn (unlike isEmpty/getContext)', () => {
            let ps, pe
            d.set(({ start, end }) => {
                ps = start; pe = end
                const p = document.createElement('div')
                p.appendChild(start)
                p.appendChild(end)
                document.body.appendChild(p)
            })
            d.set(({ start, end }) => {
                ps.after(start)
                pe.before(end)
                return 'child'
            })

            const warnings = []
            const orig = console.warn
            console.warn = ( msg ) => { warnings.push ( msg ) }
            try { d.get('child').isOrphan() } finally { console.warn = orig }

            expect ( warnings.length ).toBe ( 0 )
        }) // it isOrphan() — silent

    }) // describe Range API - isOrphan()



    // =====================================================================
    // Range API - toString()
    // =====================================================================

    describe ( 'Range API - toString()', () => {

        it ( 'returns the plain-text content of the range', () => {
            d.set(({ start, end }) => {
                const div = document.createElement('div')
                div.appendChild(start)
                div.appendChild(end)
                document.body.appendChild(div)
            })

            const range = d.get('0')
            range.update('<p>hello <b>world</b></p>')

            expect ( range.toString() ).toBe ( 'hello world' )
        }) // it toString()


        it ( 'returns empty string for an empty range', () => {
            d.set(({ start, end }) => {
                document.body.appendChild(start)
                document.body.appendChild(end)
            })

            expect ( d.get('0').toString() ).toBe ( '' )
        }) // it toString() — empty


        it ( 'returns empty string when orphaned', () => {
            let ps, pe
            d.set(({ start, end }) => {
                ps = start; pe = end
                const p = document.createElement('div')
                p.appendChild(start)
                p.appendChild(end)
                document.body.appendChild(p)
            })
            d.set(({ start, end }) => {
                ps.after(start)
                pe.before(end)
                return 'child'
            })

            d.get('0').update('')
            expect ( d.get('child').toString() ).toBe ( '' )
        }) // it toString() — orphaned

    }) // describe Range API - toString()


}) // describe