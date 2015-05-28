
let ToggleControl;
export default ToggleControl = L.Control.extend({
    options: {
        position: 'topleft',
        class: 'toggle',
        content: "FILL ME"
    },
    initialize: function (options) {
        L.setOptions(this, options);
    },
    
    onAdd: function(map) {
        const container = L.DomUtil.create('div', (this.options.class ? this.options.class + ' ' : '') + 'leaflet-bar');
        this.button = this._createButton(container);
        return container;
    },
    _createButton: function(container) {
        const link = L.DomUtil.create('a',"",container);
        link.innerHTML = this.options.content;
        link.href = '#';

        const stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .on(link, 'click', stop)
            .on(link, 'mousedown', stop)
            .on(link, 'dblclick', stop)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', this._toggleActivate, this );

        return link;
    },
    _toggleActivate: function(e) {
        const container = this.getContainer();
        if ( L.DomUtil.hasClass(container,"active") ) {
            L.DomUtil.removeClass(container,"active");
        } else if ( ! L.DomUtil.hasClass(container,"disabled")){
            L.DomUtil.addClass(container,"active");
            this.input.focus();
        }
    },
    enable: function(b) {
        const container = this.getContainer();
        if ( b ) { container.removeClass("disabled"); }
        else { container.addClass("disabled"); }
    }
    
});
