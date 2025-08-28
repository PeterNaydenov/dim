import { expect, test, describe } from 'vitest'
import dim  from '../src/main.js'

describe ( 'Dim - DOM Invisible Markers', () => {

    

test ( 'should be defined', () => {
        expect ( dim ).toBeDefined()
    }) // it should be defined



test ('should create a button element', () => {
    const button = document.createElement('button')
    button.textContent = 'Click me'
    document.body.appendChild(button)

    expect(document.querySelector('button')?.textContent).toBe('Click me')
  }) // it should create a button element



}) // describe