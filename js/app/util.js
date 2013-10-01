/*
 * Some utility functions
 *
 * Dependencies: Underscore.js
 */
define(['underscore'], function(_) {
    var util = {};

    // From the book "Functional JavaScript"
    util.existy = function(x) { return x != null };
    util.truthy = function(x) { return x !== false && existy(x) };

    // Return a normal (Gaussian) random variable
    util.getNormalRand = (function() {
        var rands = [];

        var more = function() {
            var r = Math.sqrt(-2 * Math.log(Math.random()));
            var theta = 2 * Math.PI * Math.random();
            rands.push(r * Math.sin(theta), r * Math.cos(theta));
        };
        
        return function() {
            if (_.isEmpty(rands)) {
                more();
            }
            return rands.pop();
        };
    }());

    return util;
});
