import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{svelte,ts}"],
  // purge: ["./src/**/*.{html,ts,svelte}", "./**/*.html"],
  theme: {
    extend: {},
    // fontFamily: {
    // sans: ['"Rubik"', "sans-serif"],
    // },
  },
  plugins: [
    require("daisyui"),
    plugin(function ({ addVariant }) {
      addVariant(
        "xs-only",
        "@media screen and (max-width: theme('screens.sm'))"
      );
    }),
  ],
};
