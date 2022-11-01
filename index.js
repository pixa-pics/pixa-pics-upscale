var Pixa = function(object){
    "use strict";
    if (!(this instanceof Pixa)) {
        return new Pixa();
    }

    this._functions = object || {};
};

Object.defineProperty(Pixa.prototype, 'get', {
    get: function() { "use strict"; return this._functions; },
});
Object.defineProperty(Pixa.prototype, 'set', {
    get: function() { "use strict"; return function(object){

        this._functions = object;
    }},
});

Pixa.prototype.add = function(object) {
    this.set(Object.assign(this.get, object));
    return this;
};
Pixa.prototype.upscale = function(data_url, algorithm) {
    try {
        return this.get[algorithm](data_url);
    } catch(e) {
        try {
            return Object.entries(this.get)[0][1](data_url);
        } catch(e) {
            return Promise.reject();
        }
    }
};

export default Pixa;