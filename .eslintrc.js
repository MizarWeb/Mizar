module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true
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
    astro: true
  },
  extends: "eslint:recommended",
  rules: {
    "no-unused-vars": 1,
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"]
  }
};
