/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        board: {
          ink: "#1a2f59",
          sun: "#ffd166",
          coral: "#ff7b54",
          mint: "#7ed957",
          sky: "#56c6ff",
          night: "#11315f",
          panel: "#1c4e8f",
          wood: "#8b5a2b",
          cream: "#fff7df",
          gold: "#f6b90a",
        },
      },
      fontFamily: {
        display: ["Baloo 2", "Changa", "sans-serif"],
        body: ["Nunito", "sans-serif"],
      },
      boxShadow: {
        float: "0 12px 28px rgba(31, 42, 68, 0.14)",
        glow: "0 0 0 3px rgba(255, 214, 102, 0.35), 0 14px 30px rgba(17, 49, 95, 0.35)",
        board: "0 10px 0 rgba(19, 55, 101, 0.8), 0 22px 32px rgba(10, 24, 56, 0.35)",
        wood: "inset 0 2px 0 rgba(255, 236, 182, 0.5), inset 0 -4px 0 rgba(95, 52, 21, 0.55)",
      },
    },
  },
  plugins: [],
}
