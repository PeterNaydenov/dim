# Dim (@peter.naydenov/dim)

DIM(DOM Invisible Markers) is a library that allows you to create invisible markers in the DOM.

*VERY EXPERIMENTAL STAGE - DONT USE IN PRODUCTION. Interface may change multiple times in short period of time. Versions under 1.x.x are not for use and will not follow semver rules*


## Installation

First - install the package:
```bash
npm i @peter.naydenov/dim
```
then import it
```js
import dim from '@peter.naydenov/dim'
```

## Usage
Here is short presentation of how to use the library:

```js
import dim from '@peter.naydenov/dim'
const ranges = dim (); // Create a dim storage

ranges.set ( ( {start, end} ) => { // Set first range in the storage. 
        // Note: Start and end are invisible markers.
        // Insert the start and end markers in the DOM
        let container = document.querySelector ( '#app' )
        container?.prepend ( start )   // Using '?.' prevents errors if the container is not found
        container?.append ( end )
        // App container is set as a first range.
        // Function 'set' should return the name of range. 
        return 'app'
})

const app = ranges.get ( 'app' ) // Get the range by name
// there is options to get multiple ranges in single line if ranges exist:
const [logos, counter] = ranges.get ( 'logos,counter' )

app.update ( 'Hello World' ) // Update the range content
app.update ( 'Hello World 2', 'cache' ) // Update the range content and cache the previous content
app.back () // Go back to the previous content

app.delete () // Delete the range content. If 'cache' is passed, the content will be cached before deleting it

let isEmpty = app.isEmpty () // Check if the range is empty.
// isEmpty = true.  The range is empty.

app.update ( 'Hello world' )
isEmpty = app.isEmpty ()
// isEmpty = false.  The range is not empty.

app.append ( '! <span>Extra</span>' ) // Append the code to the end of the range
// Content now is: 'Hello world! <span>Extra</span>'

app.prepend ( '1. ')
// Content now is: '1. Hello world! <span>Extra</span>'

let appContainer = app.getContext () // Returns the first node that contains the range
let span = appContainer.querySelector ( 'span' )
// span is a DOM node. <span>Extra</span>

ranges.reset () // Remove all ranges available in the storage
```


## Dim API
With Dim you can create invisible markers in the DOM(ranges), retrieve their APIs or reset the range storage.

```js
  set : 'Set the range and name it'
, get : 'Get the range by name'
, reset : 'Remove all ranges available in the storage'
```



## Range API
Range API is what you can do with content between the start and end markers (invisible range).
```js
   update     : 'Update the range content'
 , clearCache : 'Clear the range cache if it exists'
 , getContext : 'Returns the first node that contains the range'
 , isEmpty    : 'Check if the range is empty. Returns true or false'
 , delete     : 'Delete the range content. If "cache" is passed, the content will be cached before deleting it'
 , back       : 'Go back to the previous content'
 , append     : 'Append the code to the end of the range'
 , prepend    : 'Prepend the code to the start of the range'
```



## Credits
'@peter.naydenov/dim' was created and supported by Peter Naydenov.



## License
'@peter.naydenov/dim' is released under the [MIT License](http://opensource.org/licenses/MIT).


