import {base64_to_bitmap, bitmap_to_imagedata, imagedata_to_base64, base64_sanitize} from "./utils/manipulation";

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

    return new Promise(function (resolve, reject){

        base64_sanitize(data_url).then(function(data_url_in){

            base64_to_bitmap(data_url_in).then(function (bitmap){

                bitmap_to_imagedata(bitmap).then(function (imagedata_in){

                    try {
                        this.get[algorithm](imagedata_in).then(function (imagedata_out){

                            imagedata_to_base64(imagedata_out).then(function (data_url_out){

                                resolve(data_url_out);
                            });
                        });

                    } catch(e) {
                        try {
                            Object.entries(this.get)[0][1](imagedata_in).then(function (imagedata_out){

                                imagedata_to_base64(imagedata_out).then(function (data_url_out){

                                    resolve(data_url_out);
                                });
                            });
                        } catch(e) {
                            return reject();
                        }
                    }
                });
            });

        });
    });
};

export default Pixa;