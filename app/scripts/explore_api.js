
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
    getNextDepartures(stop_ids) {
        const base_params = {
            dataset: "tco-bus-circulation-passages-tr",
            rows: 1000
        };
        // multiple calls, as refinements are AND-ed and not OR-ed
        let promises = stop_ids.map( stop_id => {
            return this.callApi( base_params, {
                'refine.idarret': stop_id
            });
        });
        return new Promise( (resolve,reject) => {
            Promise.all(promises)
                .then( all_records => {
                    // transform results to return a content similar
                    // to what we previously had with the old API
                    const records = [].concat.apply([], all_records );
                    const stops = {};
                    const pairs = [];
                    for ( let i = 0; i < records.length ; ++i ) {
                        const idarret = records[i].fields.idarret;
                        const line = records[i].fields.idligne;
                        if ( undefined === stops[idarret] ) {
                            stops[idarret] = {};
                        }
                        if ( undefined === stops[idarret][line] ) {
                            stops[idarret][line] = { departures: [] };
                            pairs.push( [ idarret, line ] );
                        }
                        const accurate = records[i].fields.precision == "Temps réel";
                        stops[idarret][line].departures.push({
                            content: accurate ? records[i].fields.departtheorique : records[i].fields.depart,
                            accurate: accurate,
                            '@attributes': {
                                accurate: accurate ? "1" : "0",
                                headsign: records[i].fields.destination
                            }
                        });
                    }
                    const sortRoutesStops = ( a, b ) => {
                        return a[1] > b[1] || a[0] > b[0];
                    };
                    const result = [];
                    for( const pair of pairs.sort(sortRoutesStops) ) {
                        result.push({
                            route: pair[1],
                            stop: pair[0],
                            departures: {
                                departure: stops[pair[0]][pair[1]].departures
                            }
                        });
                    }
                    resolve(result);
                }, reject );
        });
    }
}
