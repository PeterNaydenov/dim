
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





function rangeBuilder () {
        let ranges = {};
        function set  ( name, fn, ...args ) {
                      let 
                            start = document.createTextNode ('')
                          , end   = document.createTextNode ('')
                          ;
                      fn ( {start, end}, ...args )
                      const range = document.createRange ()
                      range.setStartAfter ( start )
                      range.setEndBefore ( end )
                      let rangeAPI = makeMyAPI ( range, start, end )
                      ranges[name] = rangeAPI
              } // set func.
        function get ( name ) {
                    if ( name.includes(',') )   name = name.split ( ',').map ( n => n.trim() )
                    return (name instanceof Array) ? name.map ( n => ranges[n]) : ranges[name]
              } // get func.
        function reset () {
                  ranges = {}
              }

  return {
              set
            , get
            , reset
        }
} // rangeBuilder func.



export default rangeBuilder


