// export module Viewport
define(['vect'], function(V) {
    var Viewport = {};
    var transform = null;
    var x1, x2, y1, y2;
    var canvas, ctx;
    var bgFunc, grad, bg;

    Viewport.setCanvas = function(can) {
        canvas = can;
        ctx = canvas.getContext("2d");
    };

    Viewport.setBG = function(fun, gradient) {
        bg = ctx.createImageData(canvas.width, canvas.height);
        bgFunc = fun;
        grad = gradient;
        
        var pos = 0; // index position into imagedata array
        var vpos = 0;
        var value, rgb;
        var values = new Array(canvas.width * canvas.height);
        var min = fun.apply(null, reverseTransform(0, 0));
        var max = min;
        var diff = 0;

        // walk left-to-right, top-to-bottom; it's the
        // same as the ordering in the bg array:
        for (cy = 0; cy < canvas.height; cy++) {
            for (cx = 0; cx < canvas.width; cx++) {
                value = fun.apply(null, reverseTransform(cx, cy));
                if (value < min) { min = value; }
                else if (value > max) { max = value; }
                values[vpos++] = value;
            }
        }

        diff = max - min;
        vpos = 0;
        
        if (!gradient) {
            gradient = function(val) {
                return [val * 255, val * 255, 255];
            };
        }

        for (cy = 0; cy < 1000; cy++) {
            for (cx = 0; cx < 1000; cx++) {
                rgb = gradient(values[vpos++] / diff);
                
                // set red, green, blue, and alpha:
                bg.data[pos++] = rgb[0];
                bg.data[pos++] = rgb[1];
                bg.data[pos++] = rgb[2];
                bg.data[pos++] = 255; // opaque alpha
            }
        }
    };
 
    Viewport.setView = function(xlower, ylower, xupper, yupper) {
        x1 = xlower;
        x2 = xupper;
        y1 = ylower;
        y2 = yupper;
        transform = function(x, y) {
            return [(x - x1) * canvas.width / (x2 - x1), (y - y1) * canvas.height / (y2 - y1)];
        };
        reverseTransform = function(cx, cy) {
            return [x1 + cx * (x2 - x1) / canvas.width, y1 + cy * (y2 - y1) / canvas.height];
        };

        if (bgFunc) {
            Viewport.setBG(bgFunc, grad);
        }
    };

    Viewport.drawBall = function(pos, radius, color) {
        var canvasPos = transform(pos[0], pos[1]);
        ctx.beginPath();
        ctx.arc(canvasPos[0], canvasPos[1], radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    };

    Viewport.drawBG = function() {
        ctx.putImageData(bg, 0, 0);
    };
    
    Viewport.drawText = function(text) {
        ctx.fillStyle = 'black';
        ctx.fillText(text, 5, 15);
    };

    Viewport.clear = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return Viewport;
});
