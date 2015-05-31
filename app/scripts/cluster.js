var colors = ['green', /*'darkpurple'*/ '#301934', 'blue', 'red', 'orange'], pi2 = Math.PI * 2;

// this is from the categories example
L.Icon.MarkerCluster = L.Icon.extend({
    options: {
        iconSize: new L.Point(44, 44),
        className: 'prunecluster leaflet-markercluster-icon'
    },
    
    createIcon: function () {
        // based on L.Icon.Canvas from shramov/leaflet-plugins (BSD licence)
        var e = document.createElement('canvas');
        this._setIconStyles(e, 'icon');
        var s = this.options.iconSize;
        e.width = s.x;
        e.height = s.y;
        this.draw(e.getContext('2d'), s.x, s.y);
        return e;
    },
    
    createShadow: function () {
        return null;
    },
    
    draw: function(canvas, width, height) {
        
        var lol = 0;
        
        var start = 0;
        for (var i = 0, l = colors.length; i < l; ++i) {
            
            var size = this.stats[i] / this.population;
            
            
            if (size > 0) {
                canvas.beginPath();
                canvas.moveTo(22, 22);
                canvas.fillStyle = colors[i];
                var from = start + 0.14,
                    to = start + size * pi2;
                
                if (to < from) {
                    from = start;
                }
                canvas.arc(22,22,22, from, to);
                
                start = start + size*pi2;
                canvas.lineTo(22,22);
                canvas.fill();
                canvas.closePath();
            }
            
        }
        
        canvas.beginPath();
        canvas.fillStyle = 'white';
        canvas.arc(22, 22, 18, 0, Math.PI*2);
        canvas.fill();
        canvas.closePath();
        
        canvas.fillStyle = '#555';
        canvas.textAlign = 'center';
        canvas.textBaseline = 'middle';
        canvas.font = 'bold 12px sans-serif';
        
        canvas.fillText(this.population, 22, 22, 40);
    }
});


export const Cluster = PruneClusterForLeaflet.extend({
    PrepareLeafletMarker: function(marker,data) {
        PruneClusterForLeaflet.prototype.PrepareLeafletMarker.call(this,marker,data);
        const common_fields = ["bus","stop"];
        for ( let i = 0; i < common_fields.length; ++i ) {
            const field = common_fields[i];
            marker[field] = data[field];
        }
        marker.on( 'click', data.callback );
    }
});

export const BusCluster = Cluster.extend({
    possibleIcons: [
        {
            fn: ecartsecondes =>  Math.abs( ecartsecondes ) < 50,
            icon: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'green',
                prefix: "fa"
            })
        },
        {
            fn: ecartsecondes => ecartsecondes > 300,
            icon: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'darkpurple',
                prefix: "fa"
            })
        },
        {
            fn: ecartsecondes =>  ecartsecondes > 0,
            icon: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'blue',
                prefix: "fa"
            })
        },
        {
            fn: ecartsecondes => ecartsecondes < -300,
            icon: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'red',
                prefix: "fa"
            })
        },
        {
            fn: null,
            icon: L.AwesomeMarkers.icon({
                icon: 'bus',
                markerColor: 'orange',
                prefix: "fa"
            })
        }
    ],
    BuildLeafletClusterIcon: function(cluster) {
        var e = new L.Icon.MarkerCluster();

        e.stats = cluster.stats;
        e.population = cluster.population;
        return e;
    },
    RegisterMarker: function(marker) {
        let found = this.possibleIcons.length-1;
        for ( let i = 0; i < this.possibleIcons.length ; ++i ) {
            const possible = this.possibleIcons[i];
            if ( null !== possible.fn && possible.fn(marker.data.ecartsecondes) ) {
                found = i;
                break;
            }
        }
        marker.data.icon = this.possibleIcons[found].icon;
        marker.category = found;
        PruneClusterForLeaflet.prototype.RegisterMarker.call(this,marker);
    }
});
