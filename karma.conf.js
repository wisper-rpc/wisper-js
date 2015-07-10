// Karma configuration
// Generated on Mon Dec 22 2014 10:49:32 GMT+0100 (CET)

var cover = require('browserify-istanbul');
var coverOptions = {
  ignore: ['test/*', 'dist/*'],
  defaultIgnore: true
}

function normalizeBrowserName(browser) {
    return browser.toLowerCase().split(/[ /-]/)[0];
}

module.exports = function(karma) {
  karma.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'browserify'],

    // list of files / patterns to load in the browser
    files: [
      // 'src/**/*.es6',
      // 'test/init.js',
      'test/**/*.es6'
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.es6': [ 'browserify' ],
      'dist/*.js': ['coverage']
    },

    browserify: {
        extensions: [ '.es6' ],
        transform: [
            ['babelify', {
                optional: [
                    'es7.decorators'
                ]
            }]
        ],
        files: [
            'src/**/*.es6',
            'test/**/*Spec.es6'
        ],
        configure: function(bundle) {
            bundle.on('prebundle', function() {
                bundle.transform(cover(coverOptions));
            });
        }

    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    // junit configuration
    junitReporter: {
      outputFile: 'reports/tests/test-results.xml',
      suite: ''
    },

    coverageReporter: {
      reporters: [
        {
          type : 'cobertura',
          dir : 'reports/coverage/'
        }
      ]
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: karma.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
