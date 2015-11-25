'use strict';

// Modules
var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = function makeWebpackConfig(options) {
    /**
     * Environment type
     * BUILD is for generating minified builds
     * TEST is for generating test builds
     */
    var BUILD = !!options.BUILD;
    var TEST = !!options.TEST;

    /**
     * Config
     * Reference: http://webpack.github.io/docs/configuration.html
     * This is the object where all configuration gets set
     */
    var config = {};

    /**
     * Entry
     * Reference: http://webpack.github.io/docs/configuration.html#entry
     * Should be an empty object if it's generating a test build
     * Karma will set this when it's a test build
     */
    if (TEST) {
        config.entry = {}
    } else {
        config.entry = {
            app: './src/app.js',
            vendor: []
        };
        try {
            var packageJson = path.join(process.cwd(), 'package.json');
            var f = require('fs').lstatSync(packageJson);
            if (f.isFile()) {
                //console.log(Object.keys(require(packageJson).dependencies))
                Object.keys(require(packageJson).dependencies).forEach(function (p) {
                    try {
                        var pPath = path.join(process.cwd(), 'node_modules', p, 'package.json');
                        var pConfig = require(pPath);
                        if (!pConfig.main) {
                            var indexFile = path.join(process.cwd(), 'node_modules', p, 'index.js');
                            try {
                                if (require('fs').lstatSync(indexFile).isFile()) {
                                    config.entry.vendor.push(p)
                                }
                            } catch (e) {

                            }
                            return
                        }

                        if (typeof pConfig.main === 'string') {
                            if (['.js', '.css', '.less', '.html'].indexOf(path.extname(pConfig.main)) > -1) {
                                config.entry.vendor.push(p)
                            }
                            return
                        }
                        if (typeof pConfig.main.forEach === 'function') {
                            pConfig.main.forEach(function (mainFile) {
                                var filePath = path.join(p, mainFile);
                                if (['.js', '.css', '.less', '.html'].indexOf(path.extname(filePath)) > -1) {
                                    config.entry.vendor.push(path.join(p, mainFile))
                                }
                            })
                        }
                    } catch (e) {}
                })
            }
        } catch (e) {}
    }

    /**
     * Output
     * Reference: http://webpack.github.io/docs/configuration.html#output
     * Should be an empty object if it's generating a test build
     * Karma will handle setting it up for you when it's a test build
     */
    if (TEST) {
        config.output = {}
    } else {
        config.output = {
            // Absolute output directory
            path: path.join(process.cwd(), 'public'),

            // Output path from the view of the page
            // Uses webpack-dev-server in development
            publicPath: BUILD ? '/' : 'http://localhost:8080/',

            // Filename for entry points
            // Only adds hash in build mode
            filename: BUILD ? '[name].[hash].js' : '[name].bundle.js',

            // Filename for non-entry points
            // Only adds hash in build mode
            chunkFilename: BUILD ? '[name].[hash].js' : '[name].bundle.js'
        }
    }

    /**
     * Devtool
     * Reference: http://webpack.github.io/docs/configuration.html#devtool
     * Type of sourcemap to use per build type
     */
    if (TEST) {
        config.devtool = 'inline-source-map';
    } else if (BUILD) {
        config.devtool = 'source-map';
    } else {
        config.devtool = 'eval';
    }

    /**
     * Loaders
     * Reference: http://webpack.github.io/docs/configuration.html#module-loaders
     * List: http://webpack.github.io/docs/list-of-loaders.html
     * This handles most of the magic responsible for converting modules
     */
    config.resolveLoader = {root: require('path').join(__dirname, '..', "node_modules")};
    // Initialize module
    config.module = {
        preLoaders: [],
        loaders: [{
            // JS LOADER
            // Reference: https://github.com/babel/babel-loader
            // Transpile .js files using babel-loader
            // Compiles ES6 and ES7 into ES5 code
            test: /\.js$/,
            loader: 'ng-annotate!babel?presets[]=es2015&presets[]=stage-0',
            exclude: /node_modules/
        }, {
            // ASSET LOADER
            // Reference: https://github.com/webpack/file-loader
            // Copy png, jpg, jpeg, gif, svg, woff, woff2, ttf, eot files to output
            // Rename the file using the asset hash
            // Pass along the updated reference to your code
            // You can add here any file extension you want to get copied to your output
            test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'file'
        }, {
            // HTML LOADER
            // Reference: https://github.com/webpack/html-loader
            // Reference: https://github.com/webpack/raw-loader
            // Allow loading html through js
            test: /\.html$/,
            loader: 'html'
        }]
    };

    // ISPARTA LOADER
    // Reference: https://github.com/ColCh/isparta-instrumenter-loader
    // Instrument JS files with Isparta for subsequent code coverage reporting
    // Skips node_modules and files that end with .test.js
    if (TEST) {
        config.module.preLoaders.push({
            test: /\.js$/,
            exclude: [
                /node_modules/,
                /\.test\.js$/
            ],
            loader: 'isparta-instrumenter'
        })
    }

    // LESS LOADER
    // Reference: https://github.com/webpack/less-loader
    // less loader for webpack
    var lessLoader = {
        test: /\.less/,
        // Reference: https://github.com/webpack/extract-text-webpack-plugin
        // Extract less files in production builds
        //
        // Reference: https://github.com/webpack/style-loader
        // Use style-loader in development for hot-loading
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap!postcss!less')
    };

    // Skip loading less in test mode
    if (TEST) {
        // Reference: https://github.com/webpack/null-loader
        // Return an empty module
        lessLoader.loader = 'null'
    }

    // Add lessLoader to the loader list
    config.module.loaders.push(lessLoader);

    // CSS LOADER
    // Reference: https://github.com/webpack/css-loader
    // Allow loading css through js
    //
    // Reference: https://github.com/postcss/postcss-loader
    // Postprocess your css with PostCSS plugins
    var cssLoader = {
        test: /\.css$/,
        // Reference: https://github.com/webpack/extract-text-webpack-plugin
        // Extract css files in production builds
        //
        // Reference: https://github.com/webpack/style-loader
        // Use style-loader in development for hot-loading
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap!postcss')
    };

    // Skip loading css in test mode
    if (TEST) {
        // Reference: https://github.com/webpack/null-loader
        // Return an empty module
        cssLoader.loader = 'null'
    }

    // Add cssLoader to the loader list
    config.module.loaders.push(cssLoader);

    /**
     * PostCSS
     * Reference: https://github.com/postcss/autoprefixer-core
     * Add vendor prefixes to your css
     */
    config.postcss = [
        autoprefixer({
            browsers: ['last 2 version', '> 5%']
        })
    ];

    /**
     * Plugins
     * Reference: http://webpack.github.io/docs/configuration.html#plugins
     * List: http://webpack.github.io/docs/list-of-plugins.html
     */
    config.plugins = [
        // Reference: https://github.com/webpack/extract-text-webpack-plugin
        // Extract css files
        // Disabled when in test mode or not in build mode
        new ExtractTextPlugin('[name].[hash].css', {
            disable: !BUILD || TEST
        })
    ];

    // Skip rendering index.html in test mode
    if (!TEST) {
        // code split
        config.plugins.push(
            ///* chunkName= */"vendor", /* filename= */"vendor.bundle.js"
            new webpack.optimize.CommonsChunkPlugin({
                name: "vendor",
                // filename: "vendor.js"
                minChunks: Infinity
                // (with more entries, this ensures that no other module
                //  goes into the vendor chunk)
            })
        );
        // Reference: https://github.com/ampedandwired/html-webpack-plugin
        // Render index.html
        config.plugins.push(
            new HtmlWebpackPlugin({
                template: './src/index.html',
                inject: 'body',
                minify: BUILD
            })
        )
    }

    // Add build specific plugins
    if (BUILD) {
        config.plugins.push(
            // Reference: http://webpack.github.io/docs/list-of-plugins.html#noerrorsplugin
            // Only emit files when there are no errors
            new webpack.NoErrorsPlugin(),

            // Reference: http://webpack.github.io/docs/list-of-plugins.html#dedupeplugin
            // Dedupe modules in the output
            new webpack.optimize.DedupePlugin(),

            // Reference: http://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
            // Minify all javascript, switch loaders to minimizing mode
            new webpack.optimize.UglifyJsPlugin()
        )
    }

    /**
     * Dev server configuration
     * Reference: http://webpack.github.io/docs/configuration.html#devserver
     * Reference: http://webpack.github.io/docs/webpack-dev-server.html
     */
    config.devServer = {
        contentBase: './public',
        stats: {
            modules: false,
            cached: false,
            colors: true,
            chunk: false
        }
    };

    return config;
};