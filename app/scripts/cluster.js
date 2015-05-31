
export const Cluster = PruneClusterForLeaflet.extend({
    PrepareLeafletMarker: function(marker,data) {
        PruneClusterForLeaflet.prototype.PrepareLeafletMarker(marker,data);
        const common_fields = ["bus","stop"];
        for ( let i = 0; i < common_fields.length; ++i ) {
            const field = common_fields[i];
            marker[field] = data[field];
        }
        marker.on( 'click', data.callback );
    }
});

export const BusCluster = Cluster.extend({
    possibleIcons: {
        solate: L.AwesomeMarkers.icon({
            icon: 'bus',
            markerColor: 'darkpurple',
            prefix: "fa"
        }),
        late: L.AwesomeMarkers.icon({
            icon: 'bus',
            markerColor: 'blue',
            prefix: "fa"
        }),
        ontime: L.AwesomeMarkers.icon({
            icon: 'bus',
            markerColor: 'green',
            prefix: "fa"
        }),
        soveryearly: L.AwesomeMarkers.icon({
            icon: 'bus',
            markerColor: 'red',
            prefix: "fa"
        }),
        early: L.AwesomeMarkers.icon({
            icon: 'bus',
            markerColor: 'orange',
            prefix: "fa"
        })
    },
    PrepareLeafletMarker: function(marker,data) {
        Cluster.prototype.PrepareLeafletMarker(marker,data);
        let icon;
        if ( Math.abs( data.ecartsecondes ) < 50 ) {
            icon = this.possibleIcons.ontime;
            marker.category = 1;
        } else if ( data.ecartsecondes > 300 ) {
            icon = this.possibleIcons.solate;
            marker.category = 2;
        } else if ( data.ecartsecondes > 0 ) {
            icon = this.possibleIcons.late;
            marker.category = 3;
        } else if ( data.ecartsecondes < -300 ){
            icon = this.possibleIcons.soveryearly;
            marker.category = 4;
        } else {
            icon = this.possibleIcons.early;
            marker.category = 5;
        }
        marker.setIcon( icon );
    }
});
