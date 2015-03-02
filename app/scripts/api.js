
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
        for ( var i = 0; i < stopline.length; ++i ) {
            if ( ! $.isArray( stopline[i].departures.departure ) ) {
                stopline[i].departures.departure = [ stopline[i].departures.departure ];
            }
            var departures = stopline[i].departures.departure;
            for ( var j = 0; j < departures.length; ++j ) {
                departures[j].accurate = departures[j]['@attributes'].accurate == "1";
            }
        }
        return stopline;
    }

    getSetOfDepartures(stop_ids) {
        var params = {
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

                        var result = this.fix(data.opendata.answer.data.stopline);
                        
                        resolve(result);
                    }
                })
                .fail(reject)
            ;
        });
    }
    
    getNextDepartures(stop_ids) {

        if ( stop_ids.length > MAX_STOPS_PER_CALL ) {
            var handled_stops = stop_ids.slice(0,10);
            var remaining_stops = stop_ids.slice(10);

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
        var params = {
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
                        var base = data.opendata.answer.data.baseurl;
                        var lines = data.opendata.answer.data.line;
                        var result = [];
                        for( var i = 0; i < lines.length; ++i ) {
                            var line = lines[i];
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
