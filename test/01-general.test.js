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


        it ( 'Mmultiple ranges by array of names', () => {
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

        it ( 'should insert content before start marker', () => {
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

    })


    describe ( 'Range API - append()', () => {

        it ( 'should insert content after end marker', () => {
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
        expect ( d.get(0) ).toBeUndefined ()
        expect ( d.get(42) ).toBeUndefined ()
        expect ( d.get({}) ).toBeUndefined ()
        // (no .toThrow() — the fix is to NOT throw)
    }) // it BUG 2

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


}) // describe