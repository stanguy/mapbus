
class Sidebar {
    constructor(map) {
        const sidebar = L.control.sidebar('sidebar').addTo(map);
    }
    setContent( id, value, switchTo = false ) {
        let t = AppTemplates[id];
        console.log(`#${id}`);
        $(`#${id}`).html(t(value));
        if(switchTo) {
            L.control.sidebar('sidebar').open(id);
        }
    }
}
