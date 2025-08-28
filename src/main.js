
function _convertToDOM ( code ) {
    let fragment = document.createElement ( 'template' )
    fragment.innerHTML = code
    return fragment.content
} // convertToDOM func.



function makeMyAPI ( range, start, end ) {
    return {
              update ( code ) {
                            range.deleteContents ()
                            range.insertNode ( _convertToDOM ( code ) )
                  }
              , delete () {
                            range.deleteContents ()
                  }
              , prepend ( code ) {
                          start.after ( _convertToDOM ( code ) )
                  }
              , append ( code ) {
                          end.before ( _convertToDOM ( code ) )
                  }
              , isEmpty () {  // Space between start and end should be empty
                          return range.collapsed   
                      }
}} // makeMyAPI func.





function dim () {
        let 
              ranges  = {}
            , aliases = {}
            ;
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
                      let num = Object.keys ( ranges ).length
                      ranges[num] = rangeAPI
              } // set func.
        function get ( name ) {
                    if ( name.includes(',') )   name = name.split ( ',').map ( n => n.trim() )
                    return (name instanceof Array) ? name.map ( n => aliases[n] || ranges[n] ) : aliases[name] || ranges[name]
              } // get func.
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



export default dim


