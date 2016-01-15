exports.config =
    # See http://brunch.io/#documentation for docs.
    sourceMaps: true
    files:
        javascripts:
          joinTo:
              'js/app.js': /^app/
              'js/vendor.js': /^(vendor|bower_components)/
        stylesheets:
          joinTo: 'css/app.css'
        templates:
          joinTo: 'js/app.js'

    plugins:
        sass:
            options:
                includePaths: [
                  'bower_components/bourbon/app/assets/stylesheets'
                ]
        babel:
            presets: ['es2015']
            ignore: [
              /^(bower_components|vendor|node_modules)/
              'app/legacyES5Code/**/*'
            ]
                
    keyword:
        map:
            KEOLIS_API_KEY: -> process.env.KEOLIS_API_KEY
      

            
        

