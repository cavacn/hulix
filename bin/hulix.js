#!/usr/bin/env node

var path = require("path");
var url = require("url");
var fs = require("fs");

// Local version replaces global one
try {
    var localHulix = require.resolve(path.join(process.cwd(), "node_modules", "hulix", "bin", "hulix.js"));
    if (__filename !== localHulix) {
        return require(localHulix);
    }
} catch (e) {
}

var optimist = require("optimist")
    .usage("hulix " + require("../package.json").version + "\n" +
    "Usage: https://webpack.github.io/docs/cli.html");
var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var argv = require('minimist')(process.argv.slice(2));
var action = 'help';
if (argv._.indexOf('dev') > -1) {
    action = 'dev'
}
if (argv._.indexOf('build') > -1) {
    action = 'build'
}
switch (action) {
    case 'dev':
        devServer();
        break;
    case 'build':
        buildCode();
        break;
    default:
        helpInfo();
}

function buildCode() {
    var lastHash = null;
    var argv = {
        _: [],
        config: path.join(__dirname, '..', 'lib', 'webpack.build.js'),
        bail: true,
        p: true,
        watch: false,
        cache: true
    };
    var options = require("webpack/bin/convert-argv")(optimist, argv);
    var firstOptions = Array.isArray(options) ? options[0] : options;

    var outputOptions = Object.create(options.stats || firstOptions.stats || {});
    if (typeof outputOptions.context === "undefined") {
        outputOptions.context = firstOptions.context;
    }
    if (typeof outputOptions.colors === "undefined") {
        outputOptions.colors = require("supports-color");
    }
    if (!outputOptions.json) {
        if (typeof outputOptions.cached === "undefined")
            outputOptions.cached = false;
        if (typeof outputOptions.cachedAssets === "undefined")
            outputOptions.cachedAssets = false;

        ifArg("display-chunks", function (bool) {
            outputOptions.modules = !bool;
            outputOptions.chunks = bool;
        });

        ifArg("display-reasons", function (bool) {
            outputOptions.reasons = bool;
        });

        ifArg("display-error-details", function (bool) {
            outputOptions.errorDetails = bool;
        });

        ifArg("display-origins", function (bool) {
            outputOptions.chunkOrigins = bool;
        });

        ifArg("display-cached", function (bool) {
            if (bool)
                outputOptions.cached = true;
        });

        ifArg("display-cached-assets", function (bool) {
            if (bool)
                outputOptions.cachedAssets = true;
        });

        if (!outputOptions.exclude && !argv["display-modules"])
            outputOptions.exclude = ["node_modules", "bower_components", "jam", "components"];
    } else {
        if (typeof outputOptions.chunks === "undefined")
            outputOptions.chunks = true;
        if (typeof outputOptions.modules === "undefined")
            outputOptions.modules = true;
        if (typeof outputOptions.chunkModules === "undefined")
            outputOptions.chunkModules = true;
        if (typeof outputOptions.reasons === "undefined")
            outputOptions.reasons = true;
        if (typeof outputOptions.cached === "undefined")
            outputOptions.cached = true;
        if (typeof outputOptions.cachedAssets === "undefined")
            outputOptions.cachedAssets = true;
    }


    var compiler = webpack(options);
    compiler.run(compilerCallback);


    function compilerCallback(err, stats) {
        if (!options.watch) {
            // Do not keep cache anymore
            compiler.purgeInputFileSystem();
        }
        if (err) {
            lastHash = null;
            console.error(err.stack || err);
            if (err.details) console.error(err.details);
            if (!options.watch) {
                process.on("exit", function () {
                    process.exit(1);
                });
            }
            return;
        }
        if (stats.hash !== lastHash) {
            lastHash = stats.hash;
            process.stdout.write(stats.toString(outputOptions) + "\n");
        }
    }
}

function devServer() {
    var BUILD = false;
    var TEST = false;
    var config = require('../lib/webpack.make.js')({
        TEST: TEST,
        BUILD: BUILD
    });
    var compiler = webpack(config);
    var server = new webpackDevServer(compiler, {});
    server.listen(8080);
}

function helpInfo() {
    console.log('Usage: hulix [command] [config file]')
}


function ifArg(name, fn, init) {
    if (Array.isArray(argv[name])) {
        if (init) init();
        argv[name].forEach(fn);
    } else if (typeof argv[name] !== "undefined") {
        if (init) init();
        fn(argv[name], -1);
    }
}