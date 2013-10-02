/*
 * A module for doing particle swarm optimization. For an introduction,
 * see the 2007 paper "Defining a Standard for Particle Swarm
 * Optimization" by Daniel Bratton and James Kennedy. The "box" method
 * here is based on the standard method presented in that paper, using
 * the gbest topology (as opposed to the lbest).
 *
 * Dependencies: Underscore.js, Vect
 */
define(['underscore', 'vect', 'util'], function(_, V, Util) {
    // Object to return
    var PSO = {};

    // Defines the structure of particles
    function newParticle(pos, vel, optimize) {
        return {
            pos: pos,
            vel: vel,
            best: {
                loc: pos,
                val: optimize(pos)
            }
        };
    }

    // Iterate over the particles, finding the best one
    // The `best` argument is optional
    function calculateBest(particles, best) {
        return _.reduce(particles, function(best, part) {
            return best.val < part.best.val ? best : part.best;
        }, best || particles[0].best);
    }

    var Updater = (function() {
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
                var center = V.lcom(0.5, 0.5)(v, w);
                var radius = V.magnitude(V.subtract(w, v)) / 2;
                var rand = V.randomInSphere(v.length, center, radius);
                return V.lcom(scalar*SQUASH, -scalar*SQUASH)(rand, v);
            }
        };
        var updater = function(between) {
            between = between || "box";
            return function(chi, c1, c2) {
                return function(particle, best, optimize) {
                    particle.pos = V.add(particle.pos, particle.vel);

                    var localVel = betweenOptions[between](particle.pos, particle.best.loc, c1);
                    var globalVel = betweenOptions[between](particle.pos, best.loc, c2);
                    particle.vel = V.vectorize(function(x, y, z) { 
                        return chi * (x + y + z); 
                    })(particle.vel, localVel, globalVel);

                    var val = optimize(particle.pos);
                    if (val < particle.best.val) { 
                        particle.best.loc = particle.pos;
                        particle.best.val = val;
                    }
                };
            };
        };
        return {
            getBoxStyle: updater("box"),
            getBallStyle: updater("ball"),
            standard: (updater("box"))(0.72984, 2.05, 2.05)
        };
    }());

    function Swarm(config) {
        // Private variables
        var particles = [];     // All particles
        var best = null;        // Best particle so far
        var optimize = null;    // The function to optimize
        var particleUpdater = null;  // Updating function to use
        var iteration = 0;      // Current iteration

        // Make the optimizer work at the vector level
        optimize = function(v) { return config.fun(v[0], v[1]); }

        // Initialize the particles
        particles = _.map(_.range(config.number), function() {
                var pos = [Math.random() * (config.xmax - config.xmin) + config.xmin,
                           Math.random() * (config.ymax - config.ymin) + config.ymin];
                var vel;
                if (config.velocityInitializer) { vel = config.velocityInitializer(); }
                else { vel = V.create(0, 0); }
                return newParticle(pos, vel, optimize);
            });
        
        // Find the best
        best = calculateBest(particles);

        // Set the updater
        if (Util.existy(config.updater)) { particleUpdater = config.updater; }
        else { particleUpdater = Updater.standard; }

        this.update = function() {
            _.map(particles, function(part) {
                particleUpdater(part, best, optimize);
            });
            best = calculateBest(particles);
            iteration++;
        };

        this.getParticles = function() {
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

        this.getBest = function() {
            return {
                loc: _.clone(best.loc),
                val: _.clone(best.val)
            };
        };

        this.getIteration = function() {
            return iteration;
        };

        return this;
    };

    // ## Public Methods
    
    PSO.createSwarm = function(config) {
        return new Swarm(config);
    };

    PSO.test = function() {
        console.log(["Current best is:", best.val].join(" "));
        _.map(particles, function(part) {
            //console.log(part);
        });
    };

    PSO.updater = Updater;

    return PSO;
});



