
const AUTOMATIC_REFRESH_DELAY = 40 * 1000;

Number.prototype.zeroPadded = function() {
    let prefix = "";
    if ( this < 10 ) {
        prefix = "0";
    }
    return prefix + this;
};

class MapHandler {
    constructor() {
        L.Icon.Default.imagePath = "/images/";
        L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';

        this.api = new KeolisApi($('body').data('keolis-key'));
        this.explore = new ExploreApi();
        this.selectedLines = [];
        this.selectedStop = null;
        this.selectedBus = null;

        this.map = L.map('map');
        this.lineLayers = L.layerGroup();
        this.lineLayers.addTo(this.map);
        this.linesCache = {};
        this.map.setView([48.11, -1.65], 12);
        
        this.markers = L.markerClusterGroup({
            disableClusteringAtZoom: 16
        });
        this.busMarkers = L.markerClusterGroup({
            disableClusteringAtZoom: 12,
            iconCreateFunction: (cluster) =>  {
                const icon = this.busMarkers._defaultIconCreateFunction(cluster);
                icon.options.className += " bus";
                return icon;
            }
        });
        this.sidebar = new Sidebar(this.map);
        this.timeout = setInterval(
            () => this.timerExpires(),
            AUTOMATIC_REFRESH_DELAY
        );

        
        const layer = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
        const searchcontrol = new SearchControl();
        this.map.addControl(searchcontrol);
        searchcontrol.setCallback( x => this.search(x) );
	    attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	    subdomains: '1234'
        });
        layer.addTo(this.map);

        $.getJSON( "/data.json", data => {
            this.stops = data.Stops;
            this.lines = data.Routes;
            this.refreshStops();

            this.idx = lunr(function(){
                this.field( 'Name' ); 
            });
            const total_stops = this.stops.length;
            for( let i = 0 ; i < total_stops; ++i ) {
                const stop = this.stops[i];
                stop.id = i;
                this.idx.add(stop);
            }
        });

        this.api.getLines()
            .then( lines => {
                const pictos_by_name = {};
                for ( let i = 0; i < lines.length; ++i ) {
                    const line = lines[i];
                    pictos_by_name[line.name] = line.img;
                }
                for ( let i = 0; i < this.lines.length; ++i ) {
                    const line = this.lines[i];
                    line.img = pictos_by_name[line.Name];
                }
                this.sidebar.setContent('lines', {lines: this.lines});
            });

        Handlebars.registerHelper( 'date_to_time', (dt) => {
            const d = new Date(dt);
            return d.getHours().zeroPadded() + ":" + d.getMinutes().zeroPadded();
        });

        Handlebars.registerHelper( 'route_name', (id) => {
            const max_lines = this.lines.length;
            for( let i = 0; i < max_lines; ++i ) {
                const line = this.lines[i];
                if ( id == line.Id ) {
                    return line.Name;
                }
            }
            return id;
        });

        $(document.body).on( 'click', '.lines a', e => this.lineClick(e) );
    }

    search(kw) {
        let filter = null;
        if ( "" != kw ) {
            const subset = this.idx.search(kw).map( r => r.ref );
            const subset_match = {};
            for(let i = 0; i < subset.length; ++i ) {
                subset_match[subset[i]] = true;
            }
            filter = s => subset_match[s.id];
        }
        this.refreshStops( filter );
    }
    
    timerExpires() {
        this.updateBuses();
        this.updateStop();
    }
    
    markerClick(marker) {
        const stop = marker.stop;
        this.selectedStop = stop;
        this.updateStop(true);
    }
    
    lineClick(e) {
        e.preventDefault();
        $(e.currentTarget).toggleClass( 'selected' );
        this.selectedLines = $.map(
            this.getSelectedLinesIndex(),
            (idx) => this.lines[idx]
        );
        this.refreshSelectedLines();        
        this.updateBuses();
    }

    busMarkerClick(bus) {
        this.selectedBus = bus;
        this.updateBusDetail(true);
    }
    
    updateStop(interactive = false) {
        if ( null == this.selectedStop ) {
            return;
        }
        const members = this.selectedStop.Members;
        const stop_ids = [];
        for( let i = 0; i < members.length; ++i) {
            stop_ids.push( members[i].Id );
        }
        this.api.getNextDepartures(stop_ids).then((data) => {

            if ( this.selectedLines.length > 0 ) {
                const selected_lines_ids = {};
                for( let i = 0; i < this.selectedLines.length; ++i ) {
                    selected_lines_ids[ this.selectedLines[i].Id ] = true;
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

            this.sidebar.setContent( "times", { stopline: data, stop: this.selectedStop.Name}, interactive );
        });
    }

    getSelectedLinesIndex() {
        return $('.lines a.selected').map( (i,x)=> $(x).data('line-index'));
    }
    
    refreshSelectedLines() {
        const accepted_stops = {};

        this.lineLayers.clearLayers();

        const number_of_lines = this.selectedLines.length;
        let stops_filter = null;
        if ( 0 < number_of_lines ) {
            for( let i = 0; i < number_of_lines; ++i ) {
                const line = this.selectedLines[i];
                const lineOptions = { color: '#' + line.Colors[1] };
                for( let j = 0; j < line.Stops.length; ++j ) {
                    accepted_stops[line.Stops[j]] = true;
                }
                if ( line.Lines ) {
                    if ( undefined !== this.linesCache[line.Id] ) {
                        this.lineLayers.addLayer(this.linesCache[line.Id]);
                    } else {
                        const line_group = L.layerGroup();
                        for( let j = 0; j < line.Lines.length; ++j ) {
                            const path = line.Lines[j];
                            const poly = L.Polyline.fromEncoded( path, lineOptions );
                            line_group.addLayer(poly);
                        }
                        this.linesCache[line.Id] = line_group;
                        this.lineLayers.addLayer(line_group);
                    }
                }
            }
            stops_filter =  (s) => {
                for ( let i = 0; i < s.Members.length; ++i ) {
                    const m = s.Members[i];
                    if ( accepted_stops[m.Id] ) {
                        return true;
                    }
                }
                return false;
            };
        }
        this.refreshStops( stops_filter );
        if ( this.selectedStop ) {
            this.updateStop();
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
        if ( this.markers.hasLayer() ) {
            const bounds = this.markers.getBounds();
            this.map.panInsideBounds(bounds);
        }
    }
    updateBuses() {
        if ( 0 == this.selectedLines.length ) {
            this.busMarkers.clearLayers();
            return;
        }
        const short_names = $.map(
            this.selectedLines,
            (line) => line.Name
        );
        this.explore.getRealtimePositions(short_names).
            then( bus => {
                this.refreshBuses(bus);
            });

    }
    updateBusDetail(interactive=false) {
        this.sidebar.setContent( 'bus', { bus: this.selectedBus }, interactive );
    }
    refreshBuses(buses) {
        this.busMarkers.clearLayers();
        const bus_markers = [];
        const total_buses = buses.length;
        const busIcon = {
            solate: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'darkpurple'
            }),
            late: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'blue'
            }),
            ontime: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'green'
            }),
            soveryearly: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'red'
            }),
            early: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'orange'
            })
        };
        let new_selected_bus = null;
        for( let i = 0; i < total_buses; ++i ) {
            const bus = buses[i];
            const coords = bus.geometry.coordinates;

            if ( null != this.selectedBus && this.selectedBus.fields.idbus == bus.fields.idbus ) {
                new_selected_bus = bus;
            }
            
            let icon = null;
            if ( Math.abs( bus.fields.ecartsecondes ) < 50 ) {
                icon = busIcon.ontime;
            } else if ( bus.fields.ecartsecondes > 300 ) {
                icon = busIcon.solate;
            } else if ( bus.fields.ecartsecondes > 0 ) {
                icon = busIcon.late;
            } else if ( bus.fields.ecartsecondes < -300 ){
                icon = busIcon.soveryearly;
            } else {
                icon = busIcon.early;
            }
            
            const marker = L.marker( new L.LatLng( coords[1], coords[0] ),
                                     { icon: icon } );
            marker.bus = bus;
            marker.on( 'click', e => {
                this.busMarkerClick( e.target.bus );
            });
            bus_markers.push(marker);
        }
        if ( new_selected_bus ) {
            this.selectedBus = new_selected_bus;
        } else if ( this.selectedBus ) {
            this.selectedBus = null;
        }
        this.updateBusDetail();
        this.busMarkers.addLayers( bus_markers );
        this.map.addLayer(this.busMarkers);
    }
}
