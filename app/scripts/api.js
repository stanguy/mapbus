
const MAX_STOPS_PER_CALL = 10;
const KEOLIS_JSON_BASE_URL = 'http://data.keolis-rennes.com/json/';

class KeolisApi {
    
    constructor(key) {
        this.key = key;
    }

    fix(stopline) {
        if ( "undefined" === typeof stopline ) {
            return [];
        }
        if ( ! $.isArray( stopline ) ) {
            stopline = [ stopline ];
        }
        for ( let i = 0; i < stopline.length; ++i ) {
            if ( ! $.isArray( stopline[i].departures.departure ) ) {
                stopline[i].departures.departure = [ stopline[i].departures.departure ];
            }
            const departures = stopline[i].departures.departure;
            for ( let j = 0; j < departures.length; ++j ) {
                departures[j].accurate = departures[j]['@attributes'].accurate == "1";
            }
        }
        return stopline;
    }

    getSetOfDepartures(stop_ids) {
        const params = {
            cmd: 'getbusnextdepartures',
            version: '2.1',
            key: this.key,
            param: {
                mode: 'stop',
                stop: stop_ids
            }
        };        
        return new Promise((resolve, reject) => {
            $.ajax( KEOLIS_JSON_BASE_URL, { data: params })
                .done( data => {
                    if ( "0" != data.opendata.answer.status['@attributes'].code ) {
                        reject(data.opendata.answer.status['@attributes'].message);
                    } else {

                        const result = this.fix(data.opendata.answer.data.stopline);
                        
                        resolve(result);
                    }
                })
                .fail(reject)
            ;
        });
    }
    
    getNextDepartures(stop_ids) {

        if ( stop_ids.length > MAX_STOPS_PER_CALL ) {
            const handled_stops = stop_ids.slice(0,10);
            const remaining_stops = stop_ids.slice(10);

            return new Promise((resolve,reject) => {
                this.getNextDepartures(remaining_stops)
                    .then( data => {
                        this.getNextDepartures(handled_stops)
                            .then( data2 => {
                                resolve( data2.concat(data) );
                            }).catch(reject);
                    }).catch(reject)
                ;
            })
            ;
        } else {
            return this.getSetOfDepartures(stop_ids);
            
        }
    }

    getLines() {
        const params = {
            cmd: 'getlines',
            version: '2.0',
            key: this.key
        }; 
        return new Promise((resolve, reject) => {
            $.ajax( KEOLIS_JSON_BASE_URL, { data: params })
                .done( data => {
                    if ( "0" != data.opendata.answer.status['@attributes'].code ) {
                        reject(data.opendata.answer.status['@attributes'].message);
                    } else {
                        const base = data.opendata.answer.data.baseurl;
                        const lines = data.opendata.answer.data.line;
                        const result = [];
                        for( let i = 0; i < lines.length; ++i ) {
                            const line = lines[i];
                            result.push({ name: line.name, img: base + line.picto });
                        }
                        resolve(result);
                    }
                })
                .fail(reject)
            ;
        });
    }
}
