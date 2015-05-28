
export class Sidebar {
    constructor(map) {
        const sidebar = L.control.sidebar('sidebar').addTo(map);
    }
    setContent( id, value, switchTo = false ) {
        const t = require('templates/' + id);
        const txt_value = t(value);
        $(`#${id}`).html(txt_value);
        if ( txt_value.trim().length > 0 ) {
            const tab = $(`a[href="#${id}"]`);
            if (  tab.hasClass("disabled") ) {
                tab.removeClass("disabled");
            }
            if(switchTo) {
                L.control.sidebar('sidebar').open(id);
            }
        } else {
            $(`a[href="#${id}"]`).addClass("disabled");            
        }
    }
}
