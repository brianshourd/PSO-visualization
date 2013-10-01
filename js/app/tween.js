/*
 * A tween is an object with two functions and two pieces of data - a
 * start point, end point, velocity function, and position function.
 * Each of the velocity and position functions are functions which take
 * in a number between 0 and 1 and return the resulting position and
 * velocity.
 *
 * Dependencies: Underscore.js, Vect
 */
define(['underscore', 'vect'], function(_, V) {
    // Object to return
    var Tween = {};

    Tween.newTween = function(from, to, speed) {
        var ret = {};

        var particles = [from, to];
        speed = speed || 1;
        var started = null;
        var last = null;
        var cycle = 1000 / speed; // number of milliseconds to get
                                  // from one point to another
        var time = 0;
        var paused = null;
        var posFun = function() {};
        var resetPosFun = function(particle0, particle1) {
            particle0 = particle0 || particles[0];
            particle1 = particle1 || particles[1];
            var p0 = particle0.pos;
            var p1 = particle1.pos;
            var v0 = particle0.vel;
            var v1 = particle1.vel;
            var piece1 = V.lcom(6, -6, -6)(p1, p0, v0);
            var piece2 = V.subtract(v1, v0);
            var a = V.lcom(1, -2)(piece1, piece2);
            var b = V.lcom(-1, 3)(piece1, piece2);
            posFun = function(t) {
                return V.lcom(t*t*t/3, t*t/2, t, 1)(b, a, v0, p0);
            };
        };
        var cleanUp = function() {
            while (time > 1) {
                time = time - 1;
                last = last + cycle;
                if (particles.length > 2) { particles = _.rest(particles); }
                else if (particles.length == 2) { particles = [particles[1], particles[1]]; }
                resetPosFun();
            }
        };
        ret.addParticle = function(pt) {
            particles.push(pt);
        };
        ret.getPosition = function(now) {
            if (paused) { return paused.pos; }
            now = now || new Date();
            time = speed * (now.getTime() - last) / 1000;
            cleanUp();  // reset time, move to current point
            return posFun(time);
        };
        ret.getNextPosition = function() {
            return particles[1].pos;
        };
        ret.getNext = function() {
            return particles[1];
        };
        ret.getCurrent = function() {
            return particles[0];
        };
        started = new Date();
        last = started.getTime();
        resetPosFun();

        return ret;
    };

    return Tween;
});

