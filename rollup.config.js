import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import amd from "rollup-plugin-amd";
import { terser } from "rollup-plugin-terser";
import visualizer from "rollup-plugin-visualizer";
import pkg from "./package.json";

const globals = {
  jquery: "$",
  moment: "moment"
};

export default [
  {
    input: "src/main.js",
    external: ["jquery", "moment", "jquery-ui"],
    // Minified, browser-friendly UMD build
    output: [
      {
        name: "mizar",
        file: pkg.browser,
        format: "umd",
        globals,
        // Minify bundle using terser
        plugins: [terser()]
      },
      // Readable build
      {
        name: "mizar",
        file: "dist/mizar.js",
        format: "umd",
        globals
      }
      // CommonJS (for Node)
      // { file: pkg.main, format: "cjs", globals },
      // // ES module (for bundlers)
      // { file: pkg.module, format: "es", globals }
    ],
    plugins: [
      resolve(),
      commonjs(),
      // Resolving jquery-ui as amd modules throws an error
      amd({ exclude: ["node_modules/jquery-ui/**"] }),
      // Babel config
      babel({
        babelHelpers: "bundled",
        babelrc: false,
        exclude: ["node_modules/**"],
        // See https://github.com/browserslist/browserslist/
        presets: [["@babel/preset-env", { targets: { browsers: ["> 5%", "Firefox ESR"] }, modules: false }]]
      }),
      // Generates a stats.html file at the root to analyze the bundle
      visualizer()
    ]
  }
];
