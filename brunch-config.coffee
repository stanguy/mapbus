exports.config =
  # See http://brunch.io/#documentation for docs.
  modules:
  	definition: "commonjs"
  	wrapper: "commonjs"

  sourceMaps: true

  optimize: false
  files:
    javascripts:
      joinTo:
      	'js/app.js' : /^app/
      	'js/vendor.js' : /^(vendor|bower_components)/
      order:
        before: [
          'bower_components/modernizr/modernizr.js',
          'bower_components/jquery/jquery.js',
          'bower_components/leaflet/dist/leaflet-src.js'
        ]
    templates:
        joinTo: 'js/app.js'
    stylesheets:
      joinTo:
      	'css/app.css' : /^(app|bower_components)/
  plugins:
    sass:
      debug: false
      mode: 'native'
      options:
        includePaths: [
          'bower_components/bourbon/app/assets/stylesheets'
        ]
    babel:
        compact: false
        modules: "common"
        ignore: [
            /^(bower_components|vendor)/
        ]
  keyword:
      map:
          KEOLIS_API_KEY: -> process.env.KEOLIS_API_KEY
      

            
        

