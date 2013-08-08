/*
 * A module for doing particle swarm optimization. For an introduction,
 * see the 2007 paper "Defining a Standard for Particle Swarm
 * Optimization" by Daniel Bratton and James Kennedy. The "box" method
 * here is based on the standard method presented in that paper, using
 * the gbest topology (as opposed to the lbest).
 *
 * Dependencies: Underscore.js, Vect
 */
var PSO = (function(_, V) {
    // Object to return
    var pso = {};

    var particles = [];
    var best = null;
    var optimize = null;
    var particleUpdater = null;
    var iteration = 0;

    // setFunction takes in a function fun to optimize. fun should be a
    // function which takes two arguments - an x-value and a y-value -
    // and returns a number.
    function setOptimize(fun) {
        optimize = function(v) {
            return fun(v[0], v[1]);
        };
    }

    var setUpdater = (function() {
        var SQUASH = 0.75;
        var randomScaler = function(scalar) {
            return function(x) {
                return scalar * Math.random() * x;
            }
        };
        var betweenOptions = {
            box: function(v, w, scalar) {
                return _.map(V.subtract(w, v), randomScaler(scalar));
            },
            ball: function(v, w, scalar) {
                var center = Vect.lcom(0.5, 0.5)(v, w);
                var radius = Vect.magnitude(Vect.subtract(w, v)) / 2;
                var rand = Vect.randomInSphere(v.length, center, radius);
                //console.log(["v is", v, '\nw is', w, '\ncenter is', center, '\nradius is', radius, '\nrand is', rand].join(' '));
                return Vect.lcom(scalar*SQUASH, -scalar*SQUASH)(rand, v);
            }
        };
        return function(chi, c1, c2, between) {
            between = between || "box";
            particleUpdater = function(particle, best) {
                particle.pos = V.add(particle.pos, particle.vel);

                //console.log("trying sphere:");
                var localVel = betweenOptions[between](particle.pos, particle.best.loc, c1);
                //console.log(["result is", localVel].join(' '));
                var globalVel = betweenOptions[between](particle.pos, best.loc, c2);
                particle.vel = V.vectorize(function(x, y, z) { 
                    return chi * (x + y + z); 
                })(particle.vel, localVel, globalVel);
                //console.log(particle.vel);

                var val = optimize(particle.pos);
                if (val < particle.best.val) { 
                    particle.best.loc = particle.pos;
                    particle.best.val = val;
                }
            };
        }
    }());

    function createParticle(pos, vel) {
        return {
            pos: pos,
            vel: vel,
            best: {
                loc: pos,
                val: optimize(pos)
            }
        };
    }

    function randomParticleGenerator(xmin, ymin, xmax, ymax, velocityInitializer) {
        return function() {
            var vel;
            if (velocityInitializer) { vel = velocityInitializer(); }
            else { vel = V.create(0, 0); }
            return createParticle(V.create(Math.random() * (xmax - xmin) + xmin, Math.random() * (ymax - ymin) + ymin),
                                  vel);
        };
    }

    function randomSwarm(number, xmin, ymin, xmax, ymax, velocityInitializer) {
        particles = _.map(_.range(number), randomParticleGenerator(xmin, ymin, xmax, ymax, velocityInitializer));
        calculateBest();
    }

    function calculateBest() {
        best = _.reduce(particles, function(best, part) {
            return best.val < part.best.val ? best : part.best;
        }, best || particles[0].best);
    }

    // ## Public Methods

    pso.create = function(fun, number, xmin, ymin, xmax, ymax, velocityInitializer) {
        setOptimize(fun);
        randomSwarm(number, xmin, ymin, xmax, ymax, velocityInitializer);
        setUpdater(0.72984, 2.05, 2.05, "box");
    };

    pso.update = function() {
        _.map(particles, function(part) {
            particleUpdater(part, best);
        });
        calculateBest();
        iteration++;
    };

    pso.setUpdateMethod = function(choice) {
        if (choice == "box" || choice == "ball") {
            setUpdater(0.72984, 2.05, 2.05, choice);
        }
    };

    pso.getParticles = function() {
        return _.reduce(particles, function(memo, part) {
            memo.push({
                pos: _.clone(part.pos),
                vel: _.clone(part.vel),
                best: {
                    loc: _.clone(part.best.loc),
                    val: _.clone(part.best.val)
                }
            });
            return memo;
        }, []);
    };

    pso.getBest = function() {
        return {
            loc: _.clone(best.loc),
            val: _.clone(best.val)
        };
    };

    pso.getIteration = function() {
        return iteration;
    };

    pso.test = function() {
        console.log(["Current best is:", best.val].join(" "));
        _.map(particles, function(part) {
            //console.log(part);
        });
    };

    return pso;
}(_, Vect));



