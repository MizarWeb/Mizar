module.exports = {
  plugins: ["jest"],
  extends: ["eslint:recommended", "plugin:jest/recommended"],
  env: {
    browser: true,
    es6: true,
    jquery: true,
    "jest/globals": true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module"
  },
  globals: {
    vec3: true,
    Float32Array: true,
    Uint16Array: true,
    mat4: true,
    Uint8Array: true,
    Float64Array: true,
    quat4: true,
    Uint32Array: true,
    WCS: true,
    samp: true,
    astro: true,
    JsCsv: true,
    JsVotable: true,
    Mizar: true
  },

  rules: {
    "no-var": 1,
    eqeqeq: 1,
    "prefer-const": 1,
    "no-unused-vars": 1,
    "no-prototype-builtins": 0,
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"]
  }
};
