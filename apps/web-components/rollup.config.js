import svelte from "rollup-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";

// const production = !process.env.ROLLUP_WATCH;
const production = process.env.NODE_ENV === "production";

export default {
  input: "./src/index.ts",
  output: {
    file: "./dist/index.js",
    format: "esm",
    exports: "none",
  },

  plugins: [
    svelte({
      include: "src/**/*.svelte",
      emitCss: false,
      preprocess: sveltePreprocess(),
    }),
    resolve({
      browser: true,
      exportConditions: ["svelte"],
      extensions: [".svelte"],
    }),
    commonjs(),
    typescript(),
    production && terser(),
    !production &&
      serve({
        port: 3000,
      }),
    !production && livereload(),
  ],
};
