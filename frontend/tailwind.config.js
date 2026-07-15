/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",

    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        techmart: {
          blue: "#0066FF",

          "blue-dark": "#004FCC",

          "blue-light": "#EBF2FF",
        },
      },

      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",

          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-out",

        "slide-up": "slideUp 0.25s ease-out",
      },

      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },

        slideUp: {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },

  plugins: [],
};
