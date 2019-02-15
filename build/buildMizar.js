({
    include: ["../build/almond","Mizar"],
    out: "../Mizar.min.js",
    optimize: "none",
    api_version:"TO BE DEFINED",
    mainConfigFile: "../src/rconfig.js",
    wrap: {
	startFile: "wrap.start",
	endFile: "wrap.end"
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
});
