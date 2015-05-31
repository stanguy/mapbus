import {ToggleControl} from 'scripts/toggle_control';

export const SearchControl = ToggleControl.extend({
    options: {
        position: 'topleft',
        content: '<i class="fa fa-search"></i>',
        class: 'search'
    },
    initialize: function (options) {
        ToggleControl.prototype.initialize.call(this,options);
        this.cb = null;
        this.timeout = -1;
    },
    
    onAdd: function(map) {
        const container = ToggleControl.prototype.onAdd.call( this, map );

        this.input = L.DomUtil.create( 'input', "", container );
        this.input.type = "text";
        L.DomEvent.
            on( this.input, 'keydown', this._keydown, this )
        ;
        return container;
    },

    _onActivate: function() {
        this.input.focus();
    },
    
    setCallback: function(cb) {
        this.cb = cb;
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
    }
});
