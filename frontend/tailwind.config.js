/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        patient: {
          bg: "#FFFDF8",
          card: "#FFFFFF",
          text: "#18181B",
          muted: "#3F3F46",
          border: "#D4D4D8",
          red: "#B91C1C",
          "red-dark": "#991B1B",
          green: "#15803D",
          blue: "#1D4ED8",
          yellow: "#B45309",
        },
        caregiver: {
          DEFAULT: "#2D4A3E",
          primary: "#2D4A3E",
          secondary: "#4A6B5D",
          bg: "#F4F7F4",
          surface: "#FFFFFF",
          border: "#E2EAE4",
          accent: "#8AA39B",
          muted: "#5C6F64"
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      minHeight: {
        'touch': '56px',
        'touch-lg': '64px',
      },
      minWidth: {
        'touch': '56px',
        'touch-lg': '64px',
      }
    },
  },
  plugins: [],
}
