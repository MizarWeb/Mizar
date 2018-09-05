({
    name: "../build/almond",
    include: ['Mizar'],
    out: "../Mizar.min",
    optimize: "none",
    mainConfigFile: '../src/rconfig.js',
    wrap: {
        startFile: '../build/start.frag',
        endFile: '../build/end.frag'
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
