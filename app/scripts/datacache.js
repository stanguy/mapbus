
const _DAY = 24 * 60 * 60 * 1000 ;

function _reallyGetData( cb ) {
    $.getJSON( "/data.json", data =>{
        localStorage.setItem("data",JSON.stringify(data));
        localStorage.setItem("data_timestamp", Date.now() );
        cb(data);
    });    
}

function _getCachedData( cb, rej ) {
    const stored = localStorage.getItem("data");
    const stored_ts = parseInt( localStorage.getItem("data_timestamp") );
    if ( undefined != stored && undefined != stored_ts ) {
        if ( (Date.now() - stored_ts) < _DAY ) {
            cb(JSON.parse(stored));
            return;
        }
        $.ajax( "/data.json",{
            type: "HEAD",
            // because even though we doing a HEAD, jQuery will still
            // try to be smart and parse the empty body, so we give it
            // something to parse
            dataFilter: function() { return null; },
            success: (a,b,response) => {
                const lm = response.getResponseHeader("Last-Modified");
                const d = Date.parse(lm);
                if ( d > stored_ts ) {
                    _reallyGetData(cb);
                } else {
                    cb(JSON.parse(stored));
                }
            }
        });
    } else {
        _reallyGetData(cb);
    }
}

export default function getCachedData() {
    return new Promise( _getCachedData );
}
