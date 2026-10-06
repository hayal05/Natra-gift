import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["Lato", "system-ui", "-apple-system", "'Segoe UI'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
