

function getCachedData( cb ) {
    const stored = localStorage.getItem("data");
    if ( undefined != stored ) {
        cb(JSON.parse(stored));
    } else {
        $.getJSON( "/data.json", data =>{
            localStorage.setItem("data",JSON.stringify(data));
            cb(data);
        });
    }
}
