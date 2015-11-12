#!/usr/bin/env node
var path = require('path');
var url = require('url');
var fs = require('fs');

// Local version replaces global one
try {
    var localHulix = require.resolve(path.join(process.cwd(), 'node_modules', 'hulix', 'bin', 'hulix.js'));
    if (__filename !== localHulix) {
        return require(localHulix);
    }
} catch (e) {
}

var optimist = require('optimist')
    .usage('hulix ' + require('../package.json').version + '\n' +
        'Usage: https://webpack.github.io/docs/cli.html');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var argv = require('minimist')(process.argv.slice(2));
var action = 'help';
if (argv._.indexOf('dev') > -1) {
    action = 'dev'
}
if (argv._.indexOf('build') > -1) {
    action = 'build'
}
if (argv.v || argv.version) {
    action = 'version'
}
switch (action) {
    case 'dev':
        depsCheck();
        devServer();
        break;
    case 'build':
        depsCheck();
        buildCode();
        break;
    case 'version':
        var p = require('../package.json');
        console.log(p.name, p.version);
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
    var options = require('webpack/bin/convert-argv')(optimist, argv);
    var firstOptions = Array.isArray(options) ? options[0] : options;

    var outputOptions = Object.create(options.stats || firstOptions.stats || {});
    if (typeof outputOptions.context === 'undefined') {
        outputOptions.context = firstOptions.context;
    }
    if (typeof outputOptions.colors === 'undefined') {
        outputOptions.colors = require('supports-color');
    }
    if (!outputOptions.json) {
        if (typeof outputOptions.cached === 'undefined')
            outputOptions.cached = false;
        if (typeof outputOptions.cachedAssets === 'undefined')
            outputOptions.cachedAssets = false;

        ifArg('display-chunks', function (bool) {
            outputOptions.modules = !bool;
            outputOptions.chunks = bool;
        });

        ifArg('display-reasons', function (bool) {
            outputOptions.reasons = bool;
        });

        ifArg('display-error-details', function (bool) {
            outputOptions.errorDetails = bool;
        });

        ifArg('display-origins', function (bool) {
            outputOptions.chunkOrigins = bool;
        });

        ifArg('display-cached', function (bool) {
            if (bool)
                outputOptions.cached = true;
        });

        ifArg('display-cached-assets', function (bool) {
            if (bool)
                outputOptions.cachedAssets = true;
        });

        if (!outputOptions.exclude && !argv['display-modules'])
            outputOptions.exclude = ['node_modules', 'bower_components', 'jam', 'components'];
    } else {
        if (typeof outputOptions.chunks === 'undefined')
            outputOptions.chunks = true;
        if (typeof outputOptions.modules === 'undefined')
            outputOptions.modules = true;
        if (typeof outputOptions.chunkModules === 'undefined')
            outputOptions.chunkModules = true;
        if (typeof outputOptions.reasons === 'undefined')
            outputOptions.reasons = true;
        if (typeof outputOptions.cached === 'undefined')
            outputOptions.cached = true;
        if (typeof outputOptions.cachedAssets === 'undefined')
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
                process.on('exit', function () {
                    process.exit(1);
                });
            }
            return;
        }
        if (stats.hash !== lastHash) {
            lastHash = stats.hash;
            process.stdout.write(stats.toString(outputOptions) + '\n');
        }
    }
}

function devServer() {
    var argv = require('minimist')(process.argv.slice(3));
    argv.config = path.join(__dirname, '..', 'lib', 'webpack.config.js');
    argv['history-api-fallback'] = true;
    argv['inline'] = true;
    argv['progress'] = true;
    argv.cache = true;
    argv.info = true;
    if (!argv.port) {
        argv.port = 8080;
    }
    if (!argv.host) {
        argv.host = 'localhost';
    }

    var wpOpt = require('webpack/bin/convert-argv')(optimist, argv, {outputFilename: '/bundle.js'});
    var firstWpOpt = Array.isArray(wpOpt) ? wpOpt[0] : wpOpt;
    var options = wpOpt.devServer || firstWpOpt.devServer || {};
    // load custom backend
    var customBackEndConfig = path.join(process.cwd(), 'proxy.config.js');
    var customBackend = {};
    try {
        var fd = fs.statSync(customBackEndConfig);
        if (fd.isFile()) {
            customBackend = require(customBackEndConfig);
        }
    } catch (e) {
    }
    if (customBackend.proxy) {
        options.proxy = customBackend.proxy
    }
    if (customBackend.host) {
        options.host = customBackend.host
    }
    if (customBackend.port) {
        options.port = customBackend.port
    }

    if (argv.host !== 'localhost' || !options.host) {
        options.host = argv.host;
    }
    if (argv.port !== 8080 || !options.port) {
        options.port = argv.port;
    }
    if (!options.publicPath) {
        options.publicPath = firstWpOpt.output && firstWpOpt.output.publicPath || "";
        if (!/^(https?:)?\/\//.test(options.publicPath) && options.publicPath[0] !== '/')
            options.publicPath = '/' + options.publicPath;
    }

    if (!options.outputPath) {
        options.outputPath = '/';
    }
    if (!options.filename) {
        options.filename = firstWpOpt.output && firstWpOpt.output.filename;
    }
    [].concat(wpOpt).forEach(function (wpOpt) {
        wpOpt.output.path = '/';
    });

    if (!options.watchOptions) {
        options.watchOptions = firstWpOpt.watchOptions;
    }
    if (!options.watchDelay && !options.watchOptions) // TODO remove in next major version
    {
        options.watchDelay = firstWpOpt.watchDelay;
    }

    if (!options.hot) {
        options.hot = argv['hot'];
    }

    if (argv['content-base']) {
        options.contentBase = argv['content-base'];
        if (/^[0-9]$/.test(options.contentBase))
            options.contentBase = +options.contentBase;
        else if (!/^(https?:)?\/\//.test(options.contentBase))
            options.contentBase = path.resolve(options.contentBase);
    } else if (argv['content-base-target']) {
        options.contentBase = {target: argv['content-base-target']};
    } else if (!options.contentBase) {
        options.contentBase = process.cwd();
    }

    if (!options.stats) {
        options.stats = {
            cached: false,
            cachedAssets: false
        };
    }

    if (typeof options.stats === 'object' && typeof options.stats.colors === 'undefined')
        options.stats.colors = require('supports-color');

    if (argv['lazy'])
        options.lazy = true;

    if (!argv['info'])
        options.noInfo = true;

    if (argv['quiet'])
        options.quiet = true;

    if (argv['https'])
        options.https = true;

    if (argv['cert'])
        options.cert = fs.readFileSync(path.resolve(argv['cert']));

    if (argv['key'])
        options.key = fs.readFileSync(path.resolve(argv['key']));

    if (argv['cacert'])
        options.cacert = fs.readFileSync(path.resolve(argv['cacert']));

    if (argv['inline'])
        options.inline = true;

    if (argv['history-api-fallback'])
        options.historyApiFallback = true;

    if (argv['compress'])
        options.compress = true;

    var protocol = options.https ? 'https' : 'http';

    if (options.inline) {
        var devClient = [require.resolve('webpack-dev-server/client') + '?' + protocol + '://' + options.host + ':' + options.port];

        if (options.hot)
            devClient.push('webpack/hot/dev-server');
        [].concat(wpOpt).forEach(function (wpOpt) {
            if (typeof wpOpt.entry === 'object' && !Array.isArray(wpOpt.entry)) {
                Object.keys(wpOpt.entry).forEach(function (key) {
                    wpOpt.entry[key] = devClient.concat(wpOpt.entry[key]);
                });
            } else {
                wpOpt.entry = devClient.concat(wpOpt.entry);
            }
        });
    }
    var Server = require('webpack-dev-server');

    new Server(webpack(wpOpt), options).listen(options.port, options.host, function (err) {
        if (err) throw err;
        if (options.inline)
            console.log(protocol + '://' + options.host + ':' + options.port + '/');
        else
            console.log(protocol + '://' + options.host + ':' + options.port + '/webpack-dev-server/');
        console.log('webpack result is served from ' + options.publicPath);
        if (typeof options.contentBase === 'object')
            console.log('requests are proxied to ' + options.contentBase.target);
        else
            console.log('content is served from ' + options.contentBase);
        if (options.historyApiFallback)
            console.log('404s will fallback to %s', options.historyApiFallback.index || '/index.html');
    });

}

function helpInfo() {
    console.log('Usage: hulix [command] [config file]')
}


function ifArg(name, fn, init) {
    if (Array.isArray(argv[name])) {
        if (init) init();
        argv[name].forEach(fn);
    } else if (typeof argv[name] !== 'undefined') {
        if (init) init();
        fn(argv[name], -1);
    }
}

function depsCheck() {
    // local dependence
    var localDeps = ['babel-preset-es2015', 'babel-preset-stage-0'];
    var missingDeps = [];
    localDeps.forEach(function (mod) {
        try {
            fs.statSync(path.join(process.cwd(), 'node_modules', mod))
        } catch (e) {
            missingDeps.push(mod)
        }
    });

    if (missingDeps.length > 0) {
        console.error('missing some package, please install them with command below\n`npm i ' + missingDeps.join(' ') + ' --save-dev --registry=https://registry.npm.taobao.org` ')
        process.exit(2);
    }
}