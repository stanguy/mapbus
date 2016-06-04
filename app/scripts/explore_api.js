
const DATA_EXPLORE_BASE_URL = "https://data.explore.star.fr/api/records/1.0/search";

export class ExploreApi {

    callApi(base_params,params){
        const final_params = $.extend( {}, base_params, params );
        return new Promise((resolve,reject) => {
            $.ajax( DATA_EXPLORE_BASE_URL, { data: final_params } )
                .done( data => {
                    resolve(data.records);
                })
                .fail(reject);
        });                
    }
    
    callPositionApi(params) {
        const base_params = {
            dataset: "tco-bus-vehicules-position-tr",
            rows: 1000,
            'refine.etat': "En ligne"
        };
        return this.callApi( base_params, params );
    }
    
    getRealtimePositionsSingle(shortname) {
        return this.callPositionApi( {'refine.nomcourtligne': shortname} );
    }
    getAllRealtimePositions() {
        return this.callPositionApi({});
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
    getLines() {
        const params = {
            dataset: "tco-bus-lignes-pictogrammes-dm",
            rows: 1000,
            'refine.resolution': '1:100'
        };
        return new Promise( (resolve,reject) => {
            this.callApi( params, {})
                .then( records => {
                    resolve( records.map( entry => {
                        return {
                            name: entry.fields.nomcourtligne,
                            img: `https://data.explore.star.fr/explore/dataset/tco-bus-lignes-pictogrammes-dm/files/${entry.fields.image.id}/download/`
                        };
                    }) );
                }, reject );
        });
    }
}
