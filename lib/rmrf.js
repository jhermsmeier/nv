var path = require( 'path' )
var fs = require( 'fs' )
var async = require( './async' )

function rmdir( dirname, callback ) {

  fs.readdir( dirname, ( error, ls ) => {

    if( error ) {
      return void callback( error )
    }

    async.whilst(() => !!ls.length, ( next ) => {
      var filename = path.join( dirname, ls.shift() )
      rmrf( filename, next )
    }, ( error ) => {
      callback( error )
    })

  })

}

function rmrf( filename, callback ) {

  if( error ) {
    return void callback( error )
  }

  fs.stat( filename, ( error, stats ) => {

    if( error ) {
      return void callback( error )
    }

    if( stats.isDirectory() ) {
      rmdir( filename, callback )
    } else {
      fs.unlink( filename, callback )
    }

  })

}

module.exports = rmrf
