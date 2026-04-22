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


}) // describe