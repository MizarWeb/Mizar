({
    name: "../build/almond",
    include: ['Mizar'],
    out: "../Mizar.min",
    optimize: "none",
    api_version:"TO BE DEFINED",
    mainConfigFile: '../src/rconfig.js',
    wrap: {
        startFile: '../build/start.frag',
        endFile: '../build/end.frag'
    },
    preserveLicenseComments: false,
    onBuildRead: function (moduleName, path, contents) {
        //Always return a value.
        //This is just a contrived example.
        return contents.replace(/\[VERSION_API\]/g, this.api_version);
    },
    uglify2: {
        output: {
            beautify: false
        },
        compress: {
            unsafe: false,
            dead_code: false,
        },
        warnings: true,
        mangle: true
    }
})
