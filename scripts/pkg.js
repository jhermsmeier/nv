var path = require( 'path' )
var fs = require( 'fs' )
var pkg = require( 'pkg' )
var zlib = require( 'zlib' )
var tar = require( 'tar-stream' )
var package = require( '../package.json' )

var entrypoint = path.join( __dirname, '..', 'bin', 'n' )
var output = path.join( __dirname, '..', 'dist' )
var bindir = path.join( output, 'bin' )

try { fs.mkdirSync( output ) } catch( error ) {
  if( error.code !== 'EEXIST' )
    throw error
}

try { fs.mkdirSync( bindir ) } catch( error ) {
  if( error.code !== 'EEXIST' )
    throw error
}

function series( tasks, callback ) {

  var run = function( error ) {
    var task = tasks.shift()
    error || task == null ?
      callback( error ) :
      task( run )
  }

  run()

}

function build( target, callback ) {

  var filename = `${package.name}-${package.version}-${target.platform}-${target.arch}`
  var bin = path.join( bindir, filename + ( target.platform === 'win' ? '.exe' : '' ) )

  pkg.exec([
    entrypoint,
    '--target', `node8-${target.platform}-${target.arch}`,
    '--output', bin,
  ]).then(() => {

    var pack = tar.pack()
    var stats = fs.statSync( bin )
    var header = {
      name: package.name,
      size: stats.size,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      uname: 'node',
      gname: 'staff',
      type: 'file',
    }

    var readStream = fs.createReadStream( bin )
    var entry = pack.entry( header, function( error ) {
      if( error ) return callback( error )
      pack.finalize()
    })

    readStream.pipe( entry )

    var gzip = zlib.createGzip()
    var writeStream = fs.createWriteStream( path.join( output, filename + '.tar.gz' ) )

    pack.pipe( gzip ).pipe( writeStream )
      .on( 'error', callback )
      .on( 'close', callback )

  }).catch(( error ) => {
    callback( error )
  })

}

var targets = [
  { platform: 'macos', arch: 'x64' },
  { platform: 'macos', arch: 'x86' },
  { platform: 'win', arch: 'x64' },
  { platform: 'win', arch: 'x86' },
  { platform: 'linux', arch: 'x64' },
  { platform: 'linux', arch: 'x86' },
  // Not supported, even though documented as such
  // { platform: 'linux', arch: 'armv7' },
  // { platform: 'freebsd', arch: 'x64' },
  // { platform: 'freebsd', arch: 'x86' },
  // { platform: 'freebsd', arch: 'armv7' },
]

var tasks = targets.map(( target ) => {
  return function( next ) {
    build( target, next )
  }
})

series( tasks, ( error ) => {
  console.log( '' )
  console.log( error || 'OK' )
})
