import terser from "@rollup/plugin-terser";
import size from "rollup-plugin-size";
import resolve from "@rollup/plugin-node-resolve";

export default {
    input: "./srcs/index.js",
    output: [{ file: "dist/rfs.js", format: "esm", sourcemap: true }],
    plugins: [resolve(), terser(), size()],
};
