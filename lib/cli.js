#!/usr/bin/env node
//.usage('Usage: $0 [command] [options]');
var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var config = require('../webpack.make.js');
var argv = require('minimist')(process.argv.slice(2));
var action = 'help';
if (argv._.indexOf('dev') > -1) {
    action = 'dev'
}
if (argv._.indexOf('build') > -1) {
    action = 'build'
}
var BUILD = false;
var TEST = false;

switch (action) {
    case 'dev':
        BUILD = false;
        TEST = false;
        devServer();
        break;
    default:
        helpInfo();
}



function devServer() {
    var compiler = webpack(config({
        TEST: TEST,
        BUILD: BUILD
    }));
    var server = new webpackDevServer(compiler, {});
    server.listen(8080);
}

function helpInfo() {
    console.log('Usage: hulix [command] [config file]')
}