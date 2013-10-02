// exports App module
define([
    'jquery', 
    'viewport', 
    'pso',
    'tween',
    'vect'
    ], function($, Viewport, PSO, Tween, Vect) {
    // Default options
    var config = {
        speed: 3,
        fun: "sqr",
        params: {
            chi: 0.72984,
            c1: 2.05,
            c2: 2.05,
            n: 10,
        },
        options: {
            ballmethod: false
        },
        liveOptions: {
            drawbg: true,
            drawmin: true,
            drawgmin: true,
            drawlmin: true,
            drawparts: true,
        }
    };

    var swarm;
    var parts;
    var tweens;
    var goalTween;
    var particleInterval;
    var drawInterval;

    // Set up canvas
    var jqcanvas = $("#viewport");
    var canvas = jqcanvas.get(0);
    var ctx = canvas.getContext("2d");
    Viewport.setCanvas(canvas);

    // Optimization functions
    var functions = (function() {
        var sqr = function(x, y) {
            return x*x + y*y;
        };
        sqr.best = [0, 0];
        sqr.limits = [-100, -100, 100, 100];

        var rose = function(x, y) {
            return 100 * (y - x * x) * (y - x * x) + (1 - x) * (1 - x);
        };
        rose.best = [1, 1];
        rose.limits = [-2.048, -2.048, 2.048, 2.048];

        var rast = function(x, y) {
            return 20 + x*x - 10*Math.cos(2*Math.PI*x) + y*y - 10*Math.cos(2*Math.PI*y);
        };
        rast.best = [0, 0];
        rast.limits = [-5, -5, 5, 5];

        return {
            sqr: sqr,
            rose: rose,
            rast: rast
        };
    }());

    var readLiveOptions = function() {
        $('#liveOptionsInput input').each(function() {
            config.liveOptions[$(this).val()] = $(this).prop('checked');
        });
        //console.log(config.liveOptions);
    };

    var readForm = function() {
        // Set all of the options
        // Set function
        config.fun = $('input[name=functionSelect]:checked').val();
        // Set parameters
        $('#paramsInput input').each(function() { 
            config.params[$(this).prop('name')] = parseFloat($(this).val());
        });
        config.params.n = Math.round(config.params.n);
        // Set options
        $('#optionsInput input').each(function() {
            config.options[$(this).val()] = $(this).prop('checked');
        });
        // Set live options
        readLiveOptions();
        console.log(config);
    };

    var resetForm = function(hardReset) {
        config.params = {
            chi: 0.72984,
            c1: 2.05,
            c2: 2.05,
            n: 10
        };
        $('#paramsInput input').each(function() { 
            $(this).val(config.params[$(this).prop('name')]);
        });
        if (hardReset) {
            $('input[name=functionSelect][value="' + config.fun + '"]').attr('checked', 'checked');
            $('#optionsInput input').each(function() {
                $(this).prop('checked', config.options[$(this).val()]);
            });
            $('#liveOptionsInput input').each(function() {
                $(this).prop('checked', config.liveOptions[$(this).val()]);
            });
        }
    };

    var resetCanvas = function() {
        // Resize canvas to proper size
        canvas.width = (jqcanvas.parent().width());
        canvas.height = canvas.width;
    };

    var createSwarm = function() {
        var updater;
        if (config.options['ballmethod']) { updater = PSO.updater.getBallStyle(config.params.chi, config.params.c1, config.params.c2); }
        else { updater = PSO.updater.getBoxStyle(config.params.chi, config.params.c1, config.params.c2); }
        var fun = functions[config.fun];

        swarm = PSO.createSwarm({
            fun: fun,
            number: config.params.n,
            xmin: fun.limits[0],
            ymin: fun.limits[1],
            xmax: fun.limits[2],
            ymax: fun.limits[3],
            velocityInitializer: function() { return Vect.randomInSphere(2, null, 5); },
            updater: updater
        });
    };

    var getGoalParticle = function() {
        var goal = swarm.getBest();
        return {
            pos: goal.loc,
                vel: Vect.create(0,0)
        };
    };

    var setUpTweens = function() {
        parts = swarm.getParticles();
        swarm.update();
        var nextParts = swarm.getParticles();
        tweens = _.reduce(_.zip(parts, nextParts), function(memo, pair) {
            memo.push(Tween.newTween(pair[0], pair[1], config.speed));
            return memo;
        }, []);
        parts = nextParts;
        goalTween = Tween.newTween(getGoalParticle(), getGoalParticle(), config.speed);
    };

    var nextParticles = function() {
        swarm.update();
        var nextParts = swarm.getParticles();
        _.map(_.zip(nextParts, tweens), function(pair) {
            pair[1].addParticle(pair[0]);
        });
        goalTween.addParticle(getGoalParticle());
        parts = nextParts;
    }

    var start = function() {
        resetCanvas();
        readForm();

        // Set up viewport
        Viewport.setView.apply(null, functions[config.fun].limits);
        Viewport.drawText("Preparing Background");
        Viewport.setBG(functions[config.fun]);
        Viewport.clear();
        Viewport.drawText("Creating Swarm");
        createSwarm();
        setUpTweens();
        nextParticles();

        // Set up intervals
        particleInterval = setInterval(function() {
            nextParticles();
        }, 1000 / config.speed);
        var draw = function() {
            Viewport.clear();
            if (config.liveOptions['drawbg']) { Viewport.drawBG(); }
            _.map(tweens, function(tween) {
                var pos = tween.getPosition();
                var best = tween.getCurrent().best.loc;
                if (config.liveOptions['drawlmin']) { Viewport.drawBall(best, 10, 'yellow'); }
                if (config.liveOptions['drawparts']) { Viewport.drawBall(pos, 10, 'black'); }
            });
            if (config.liveOptions['drawgmin']) { Viewport.drawBall(goalTween.getPosition(), 10, 'green'); }
            if (config.liveOptions['drawmin']) { Viewport.drawBall(functions[config.fun].best, 10, 'red'); }
            Viewport.drawText(swarm.getIteration());
            // Reset
            drawInterval = requestAnimationFrame(draw);
        };
        drawInterval = requestAnimationFrame(draw);
    };

    var stop = function() {
        clearInterval(particleInterval);
        cancelAnimationFrame(drawInterval);
    };

    return {
        start: start,
        stop: stop,
        resetForm: resetForm,
        readLiveOptions: readLiveOptions
    };
});


