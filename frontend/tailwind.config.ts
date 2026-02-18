import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          DEFAULT: "#0085ff",
          hover: "#006fd6",
        },
        shell: "#f2f2f2",
        heading: "#0f1419",
        "secondary-text": "#536471",
        card: "#ffffff",
      },
    },
  },
  plugins: [],
};
export default config;
