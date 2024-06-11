/** @type {import('tailwindcss').Config} */

import daisyui from "daisyui";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      Poetsen: ["Poetsen", "serif"],
      Nunito: ["Nunito", "serif"],
    },
    extend: {},
  },

  // Attaching the all plugins here
  plugins: [daisyui],

  // daisyUI config
  daisyui: {
    themes: true,
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};
