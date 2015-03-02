exports.config =
  # See http://brunch.io/#documentation for docs.
  modules:
  	definition: false
  	wrapper: (path,data) ->
        if m = path.match /templates\/(.*).hbs/
            return """
;window.AppTemplates = window.AppTemplates || {};
window.AppTemplates['#{m[1]}'] = function(){
    var m = { exports: true };
    (function(module){
        #{data}
    })(m);
    return m.exports;
}();
            """
        return data

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
    ES6to5:
        whitelist: []
        compact: false
        format:
            semicolons: false
        ignore: [
            /^(bower_components|vendor)/
        ]
  keyword:
      map:
          KEOLIS_API_KEY: -> process.env.KEOLIS_API_KEY
      

            
        

