import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import summary from "rollup-plugin-summary";
import replace from "@rollup/plugin-replace";
import analyze from "rollup-plugin-analyzer";

import pkg from "./package.json" assert { type: "json" };

const plugins = [
  typescript({
    tsconfig: "tsconfig.json"
  }),
  nodeResolve({
    mainFields: ["module", "main"]
  }),
  commonjs(),
  replace({ __VERSION__: `'${pkg.version}'`, preventAssignment: true }),
  // analyze({ summaryOnly: true }),
  summary(),
];

/**
 * @type {import("rollup").OutputOptions}
 */
const configs = {
  input: ["src/index.ts"],
  output: [{
    format: "cjs",
    dir: "dist",
    preserveModules: true,
    exports: "named",
    entryFileNames: "[name].cjs",
    interop: "auto",
    sourcemap: true
  }, {
    dir: "dist", preserveModules: true, sourcemap: true
  }],
  plugins: [
    ...plugins,
  ],
  external: [/node_modules/, /@loopauth/]
};

export default configs;
