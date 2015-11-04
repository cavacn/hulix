#!/usr/bin/env node
//.usage('Usage: $0 [command] [options]');
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
    var BUILD = true;
    var TEST = false;
    var lastHash = null;
    var options = {
        watch: false
    };
    var config = require('../webpack.make.js')({
        TEST: TEST,
        BUILD: BUILD
    });
    var compiler = webpack(config);
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
        /*if(outputOptions.json) {
         process.stdout.write(JSON.stringify(stats.toJson(outputOptions), null, 2) + "\n");
         } else */
        if (stats.hash !== lastHash) {
            lastHash = stats.hash;
            process.stdout.write(stats.toString() + "\n");
        }
    }
}

function devServer() {
    var BUILD = false;
    var TEST = false;
    var config = require('../webpack.make.js')({
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

