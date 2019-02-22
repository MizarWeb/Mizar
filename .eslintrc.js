module.exports = {
    "env": {
        "browser": true,
	"amd":true    
    },
    "globals": {
        "vec3": true,
        "Float32Array":true,
	"Uint16Array":true,    
	"mat4":true,
	"Uint8Array":true,
	"Float64Array":true,
	"quat4":true,
	"Uint32Array":true,
	"WCS":true,
	"samp":true,
	"astro":true    
    },	
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 6
    },
    "rules": {
	"no-unused-vars": "off",
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
	"max-line-length": [
		true, 
		120
	]
    },
};
