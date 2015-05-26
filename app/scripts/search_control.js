let SearchControl = L.Control.extend({
    options: {
        position: 'topleft'
    },
    initialize: function (options) {
        L.setOptions(this, options);
        this.cb = null;
        this.timeout = -1;
    },
    
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'search leaflet-bar');
        this.button = this._createButton(container);
        return container;
    },

    setCallback: function(cb) {
        this.cb = cb;
    },
    
    _createButton: function(container) {
        const link = L.DomUtil.create('a',"",container);
        link.innerHTML = '<i class="fa fa-search"></i>';
        link.href = '#';

        const stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .on(link, 'click', stop)
            .on(link, 'mousedown', stop)
            .on(link, 'dblclick', stop)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', this._toggleActivate, this );

        this.input = L.DomUtil.create( 'input', "", container );
        this.input.type = "text";
        L.DomEvent.
            on( this.input, 'keydown', this._keydown, this )
        ;
        
        return link;
    },
    _keydown: function(e) {
        if ( null == this.cb ) { return; }
        if ( -1 != this.timeout ) {
            clearTimeout(this.timeout);
            this.timeout = -1;
        }
        if ( 27 == e.keyCode ) {
            this.cb();
            this.input.value = "";
            this._toggleActivate();
            return;
        }
        this.timeout = setTimeout(
            () => {
                this.timeout = -1;
                this.cb(this.input.value);
            },
            50
        );
    },
    _toggleActivate: function(e) {
        const container = this.getContainer();
        if ( L.DomUtil.hasClass(container,"active") ) {
            L.DomUtil.removeClass(container,"active");
        } else {
            L.DomUtil.addClass(container,"active");
            this.input.focus();
        }
    }
});
