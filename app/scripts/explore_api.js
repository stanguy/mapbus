
const DATA_EXPLORE_BASE_URL = "https://data.explore.star.fr/api/records/1.0/search";

export class ExploreApi {


    callApi(params) {
        const base_params = {
            dataset: "tco-bus-vehicules-position-tr",
            rows: 1000,
            'refine.etat': "En ligne"
        };
        const final_params = $.extend( {}, base_params, params );
        return new Promise((resolve,reject) => {
            $.ajax( DATA_EXPLORE_BASE_URL, { data: final_params } )
                .done( data => {
                    resolve(data.records);
                })
                .fail(reject);
        });        
    }
    
    getRealtimePositionsSingle(shortname) {
        return this.callApi( {'refine.nomcourtligne': shortname} );
    }
    getAllRealtimePositions() {
        return this.callApi({});
    }
    getRealtimePositions(shortnames) {
        const current = shortnames.pop();
        return new Promise((resolve,reject) => {
            this.getRealtimePositionsSingle(current)
                .then( records => {
                    if ( shortnames.length > 0 ) {
                        this.getRealtimePositions(shortnames)
                            .then( other_records => {
                                resolve( records.concat(other_records) );
                            }, reject );
                    } else {
                        resolve(records);
                    }
                }, reject );
        });
    }
}
