
const DATA_EXPLORE_BASE_URL = "https://data.explore.star.fr/api/records/1.0/search";

export class ExploreApi {

    getRealtimePositionsSingle(shortname) {
        const params = {
            dataset: "tco-bus-vehicules-position-tr",
            rows: 1000,
            'refine.etat': "En ligne",
            'refine.nomcourtligne': shortname
        };
        return new Promise((resolve,reject) => {
            $.ajax( DATA_EXPLORE_BASE_URL, { data: params } )
                .done( data => {
                    resolve(data.records);
                })
                .fail(reject);
        });
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
