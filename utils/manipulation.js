import pool from "./pool";
var AFunction = Object.getPrototypeOf(async function(){}).constructor;
window.manipulation = {};
window.file_to_base64_process_function = new AFunction(`var t = function(file) {
    "use strict";
    try {
    
        if (typeof FileReaderSync === "undefined") {
            throw new Error("Impossible to create FileReaderSync in this web environment.");
        }
        
        return new Promise(function(resolve, _) {
            resolve(FileReaderSync.readAsDataURL(file));
        });
    } catch(error) {
    
        return new Promise(function(resolve, _) {
            var reader = new FileReader();
            reader.onload = function(){ resolve(reader.result)};
            reader.onerror = function(){ var u = URL.createObjectURL(file); resolve(u); URL.revokeObjectURL(u);};
            reader.readAsDataURL(file);
        });
    }
}; return t;`)();


window.manipulation.file_to_base64 = function(file) {

    if(pool !== null) {

        return pool.exec(window.file_to_base64_process_function, [
            file
        ]).catch((e) => {

            return window.file_to_base64_process_function(file);
        }).timeout(5 * 1000);

    }else {

        return window.file_to_base64_process_function(file);
    }
};

window.base64_sanitize_process_function = new AFunction(`var t = function(base64) {
    "use strict";
    return new Promise(function(resolve, reject) {
        var img = new Image();
        var is_png = base64.startsWith("data:image/png;base64,");
        img.onload = function() {
    
            var canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL(is_png ? "image/png": "image/jpeg")); 
        };
        img.onerror = function() { reject(); };
        img.src = base64;
    });
}; return t;`)();

window.manipulation.base64_sanitize = function(base64) {

    if(pool !== null) {

        return pool.exec(window.base64_sanitize_process_function, [
            base64
        ]).catch((e) => {

            return window.base64_sanitize_process_function(base64);
        }).timeout(5 * 1000);

    }else {

        return window.base64_sanitize_process_function(base64);
    }
};

window.base64_to_bitmap_process_function = new AFunction(`var t = function(base64) {

    "use strict";

    return fetch(base64).then(function(res) {

        return res.blob().then(function(blb){

            return createImageBitmap(blb, {
                premultiplyAlpha: 'premultiply',
                resizeQuality: 'pixelated'
            });
        });
    });

}; return t;`)();

window.manipulation.base64_to_bitmap = function(base64) {



        if(pool !== null) {

            return pool.exec(window.base64_to_bitmap_process_function, [
                base64
            ]).catch((e) => {

                return window.base64_to_bitmap_process_function(base64);
            }).timeout(5 * 1000);

        }else {

            return window.base64_to_bitmap_process_function(base64);
        }

};

window.manipulation.bitmap_to_imagedata = function(bitmap, resize_to =  1920*1080) {

        let scale = 1;
        while (Math.round(bitmap.width * scale) * Math.round(bitmap.height * scale) > resize_to) { scale -= 0.01; }

        let canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);

        let ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);  // "getImageData" isn't available in web worker
};

window.imagedata_to_base64_process_function = new AFunction(`var t = function(imagedata, type) {

    "use strict"
    
    try {
    
        if (typeof OffscreenCanvas === "undefined") {
            throw new Error("Impossible to create OffscreenCanvas in this web environment.");
        }
        
        if (typeof FileReaderSync === "undefined") {
            throw new Error("Impossible to create FileReaderSync in this web environment.");
        }
        
        return new Promise(function(resolve, _) {

            var base64 = createImageBitmap(imagedata, {
                premultiplyAlpha: 'premultiply',
                resizeQuality: 'pixelated'
            }).then(function(bmp){
            
                var canvas = new OffscreenCanvas(imagedata.width, imagedata.height);
                var ctx = canvas.getContext("bitmaprenderer");
                ctx.imageSmoothingEnabled = false;
                ctx.transferFromImageBitmap(bmp);
                bmp = null;
                
                return canvas.convertToBlob({type: type}).then(function(blb) {
                    
                    return FileReaderSync.readAsDataURL(blb);
                });
            });
        
            resolve(base64);
        });
       
    }catch (e) {
    
        return new Promise(function(resolve, _) {
            var canvas = document.createElement("canvas");
            canvas.width = imagedata.width;
            canvas.height = imagedata.height;
            var ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            ctx.putImageData(imagedata, 0, 0);
            
            var base64 = canvas.toDataURL("image/png");
            canvas = null;
            resolve(base64);
        });
    }

}; return t;`)();

window.manipulation.imagedata_to_base64 = function(imagedata, type= "image/png") {

        if(pool !== null) {

            return pool.exec(window.imagedata_to_base64_process_function, [
                imagedata, type
            ]).catch((e) => {

                return window.imagedata_to_base64_process_function(imagedata, type);
            }).timeout(5 * 1000);

        }else {

            return window.imagedata_to_base64_process_function(imagedata, type);
        }

};

export default window.manipulation;