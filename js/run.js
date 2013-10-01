require.config({
    baseUrl: 'js',
    paths: {
        // Libs
        'underscore': 'lib/underscore',
        'jquery': 'lib/jquery-2.0.3.min',
        'requestAnimationFrame': 'lib/requestAnimationFrame',
        
        // My modules
        'app': 'app/app',
        'viewport': 'app/viewport',
        'pso': 'app/pso',
        'tween': 'app/tween',
        'util': 'app/util',
        'vect': 'app/vect'
    },
    shim: {
        'underscore': {
            exports: '_'
        },
    }
});

require([
    'requestAnimationFrame',
    'app'
    ], function(RAF, App) {
    // Setup the requestAnimationFrame shim
    RAF.initialize();

    // Define behaviors
    var buttons = $('#buttons');
    buttons.find('button[name="start"]').on('click', function() {
        App.start();
        $('#clickStart').hide();
    });
    buttons.find('button[name="reset"]').on('click', function() {
        App.resetForm();
    });
    buttons.find('button[name="stop"]').on('click', function() {
        console.log("stop!");
        App.stop();
    });
    // Set live options
    $('#liveOptionsInput input:checkbox').on('change', function() {
        App.readLiveOptions();
    });

    App.resetForm(true);
});

