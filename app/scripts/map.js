
Number.prototype.zeroPadded = function() {
    let prefix = "";
    if ( this < 10 ) {
        prefix = "0";
    }
    return prefix + this;
};

class MapHandler {
    constructor() {

        this.api = new KeolisApi($('body').data('keolis-key'));

        L.Icon.Default.imagePath = "/images/";
        this.map = L.map('map');
        this.lineLayers = [];
        this.stop = null;
        this.map.setView([51.2, 7], 9);
        
        const layer = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
	    attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	    subdomains: '1234'
        });
        layer.addTo(this.map);
        
        const sidebar = L.control.sidebar('sidebar').addTo(this.map);
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

                const pictos_by_name = {};
                for ( var i = 0; i < lines.length; ++i ) {
                    var line = lines[i];
                    pictos_by_name[line.name] = line.img;
                }
                for ( var i = 0; i < this.lines.length; ++i ) {
                    let line = this.lines[i];
                    line.img = pictos_by_name[line.Name];
                }
                let t = AppTemplates['lines'];
                $('#home').html(t({lines: this.lines}));
            });

        Handlebars.registerHelper( 'date_to_time', (dt) => {
            const d = new Date(dt);
            return d.getHours().zeroPadded() + ":" + d.getMinutes().zeroPadded();
        });

        Handlebars.registerHelper( 'route_name', (id) => {
            const max_lines = this.lines.length;
            for( var i = 0; i < max_lines; ++i ) {
                const line = this.lines[i];
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
        const stop = marker.stop;
        this.stop = stop;
        this.updateStop(stop);
    }
    updateStop(stop) {
        const members = stop.Members;
        const stop_ids = [];
        for( var i = 0; i < members.length; ++i) {
            stop_ids.push( members[i].Id );
        }
        this.api.getNextDepartures(stop_ids).then((data) => {

            const selected_lines = this.getSelectedLinesIndex();
            if ( selected_lines.length > 0 ) {
                const selected_lines_ids = {};
                for( var i = 0; i < selected_lines.length; ++i ) {
                    selected_lines_ids[ this.lines[selected_lines[i]].Id ] = true;
                }
                const tmp_data = [];
                for( let i = 0; i < data.length; ++i ) {
                    if ( selected_lines_ids[data[i].route]) {
                        tmp_data.push( data[i] );
                    }
                }
                data = tmp_data;
            }
            
            for( let i = 0; i < data.length; ++i ) {
                data[i].headsign = data[i].departures.departure[0]['@attributes'].headsign;
            }
            
            const t = AppTemplates['times'];            
            const content = t({ stopline: data, stop: stop.Name});
            $('#times').html( content );
            L.control.sidebar('sidebar').open('times');

        });
    }

    getSelectedLinesIndex() {
        return $('.lines a.selected').map( (i,x)=> $(x).data('line-index'));
    }
    
    refreshSelectedLines() {
        const selected_lines = this.getSelectedLinesIndex();
        const accepted_stops = {};

        for( let i = 0; i < this.lineLayers.length; ++i ) {
            this.map.removeLayer(this.lineLayers[i]);
        }
        this.map.lineLayers = [];

        if ( 0 == selected_lines.length ) {
            this.refreshStops();
            return;
        }
        
        for( let i = 0; i < selected_lines.length; ++i ) {
            const line = this.lines[selected_lines[i]];
            const lineOptions = { color: '#' + line.Colors[1] };
            for( let j = 0; j < line.Stops.length; ++j ) {
                accepted_stops[line.Stops[j]] = true;
            }
            for( let j = 0; j < line.Lines.length; ++j ) {
                const path = line.Lines[j];
                const poly = L.Polyline.fromEncoded( path, lineOptions );
                poly.addTo( this.map );
                this.lineLayers.push(poly);
            }
        }
        this.refreshStops( (s) => {
            for ( let i = 0; i < s.Members.length; ++i ) {
                const m = s.Members[i];
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
        const total_stops = this.stops.length;
        const stop_markers = [];
        for ( let i = 0; i < total_stops; ++i ) {
            const stop = this.stops[i];
            if ( filter(stop) ) {
                const marker = L.marker( new L.LatLng( stop.Pos[1], stop.Pos[0] ),
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
        
        const bounds = this.markers.getBounds();
        this.map.panInsideBounds(bounds);
    }
}
