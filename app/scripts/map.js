
Number.prototype.zeroPadded = function() {
    var prefix = "";
    if ( this < 10 ) {
        prefix = "0";
    }
    return prefix + this;
}

class MapHandler {
    constructor() {

        this.api = new KeolisApi($('body').data('keolis-key'));

        L.Icon.Default.imagePath = "/images/";
        this.map = L.map('map');
        this.lineLayers = [];
        this.stop = null;
        this.map.setView([51.2, 7], 9);
        
        var layer = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
	    attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	    subdomains: '1234'
        });
        layer.addTo(this.map);
        
        var sidebar = L.control.sidebar('sidebar').addTo(this.map);
        this.markers = L.markerClusterGroup({
            disableClusteringAtZoom: 16
        });
        
        $.getJSON( "/data.json", data => {
            this.stops = data.Stops;
            this.lines = data.Routes;
            this.refreshStops();
        });

        this.api.getLines()
            .then( lines => {

                var pictos_by_name = {};
                for ( var i = 0; i < lines.length; ++i ) {
                    var line = lines[i];
                    pictos_by_name[line.name] = line.img;
                }
                for ( var i = 0; i < this.lines.length; ++i ) {
                    var line = this.lines[i];
                    line.img = pictos_by_name[line.Name];
                }
                var t = AppTemplates['lines'];
                $('#home').html(t({lines: this.lines}));
            });

        Handlebars.registerHelper( 'date_to_time', (dt) => {
            var d = new Date(dt);
            return d.getHours().zeroPadded() + ":" + d.getMinutes().zeroPadded();
        });

        Handlebars.registerHelper( 'route_name', (id) => {
            var max_lines = this.lines.length;
            for( var i = 0; i < max_lines; ++i ) {
                var line = this.lines[i];
                if ( id == line.Id ) {
                    return line.Name;
                }
            }
            return id;
        });

        $(document.body).on( 'click', '.lines a', (e) => {
            e.preventDefault();
            $(e.currentTarget).toggleClass( 'selected' );
            this.refreshSelectedLines();
        });
    }
    
    markerClick(marker) {
        var stop = marker.stop;
        this.stop = stop;
        this.updateStop(stop);
    }
    updateStop(stop) {
        var members = stop.Members;
        var stop_ids = [];
        for( var i = 0; i < members.length; ++i) {
            stop_ids.push( members[i].Id );
        }
        this.api.getNextDepartures(stop_ids).then((data) => {

            var selected_lines = this.getSelectedLinesIndex();
            if ( selected_lines.length > 0 ) {
                var selected_lines_ids = {};
                for( var i = 0; i < selected_lines.length; ++i ) {
                    selected_lines_ids[ this.lines[selected_lines[i]].Id ] = true;
                }
                var tmp_data = [];
                for( var i = 0; i < data.length; ++i ) {
                    if ( selected_lines_ids[data[i].route]) {
                        tmp_data.push( data[i] );
                    }
                }
                data = tmp_data;
            }
            
            for( var i = 0; i < data.length; ++i ) {
                data[i].headsign = data[i].departures.departure[0]['@attributes'].headsign;
            }
            
            var t = AppTemplates['times'];            
            var content = t({ stopline: data, stop: stop.Name});
            $('#times').html( content );
            L.control.sidebar('sidebar').open('times');

        });
    }

    getSelectedLinesIndex() {
        return $('.lines a.selected').map( (i,x)=> $(x).data('line-index'));
    }
    
    refreshSelectedLines() {
        var selected_lines = this.getSelectedLinesIndex();
        var accepted_stops = {};

        for( var i = 0; i < this.lineLayers.length; ++i ) {
            this.map.removeLayer(this.lineLayers[i]);
        }
        this.map.lineLayers = [];
        
        for( var i = 0; i < selected_lines.length; ++i ) {
            var line = this.lines[selected_lines[i]];
            var lineOptions = { color: '#' + line.Colors[1] };
            for( var j = 0; j < line.Stops.length; ++j ) {
                accepted_stops[line.Stops[j]] = true;
            }
            for( var j = 0; j < line.Lines.length; ++j ) {
                var path = line.Lines[j];
                var poly = L.Polyline.fromEncoded( path, lineOptions );
                poly.addTo( this.map );
                this.lineLayers.push(poly);
            }
        }
        this.refreshStops( (s) => {
            for ( var i = 0; i < s.Members.length; ++i ) {
                var m = s.Members[i];
                if ( accepted_stops[m.Id] ) {
                    return true;
                }
            }
            return false;
        });
        if ( this.stop ) {
            this.updateStop(this.stop);
        }
    }

    refreshStops( filter ) {
        if ( undefined == filter ) {
            filter = () => true;
        }
        this.markers.clearLayers();
        var total_stops = this.stops.length;
        var stop_markers = [];
        for ( var i = 0; i < total_stops; ++i ) {
            var stop = this.stops[i];
            if ( filter(stop) ) {
                var marker = L.marker( new L.LatLng( stop.Pos[1], stop.Pos[0] ),
                                       { title: stop.Name });
                marker.stop = stop;
                marker.on( 'click', e => {
                    this.markerClick(e.target);
                });
                stop_markers.push( marker );
            }
        }
        this.markers.addLayers( stop_markers );
        this.map.addLayer(this.markers);
        
        var bounds = this.markers.getBounds();
        this.map.panInsideBounds(bounds);
    }
}
