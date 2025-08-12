/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        card: "0 .5rem 1rem rgba(0,0,0,.05)"
      },
      borderRadius: {
        xl: "1rem",
        '2xl': "1.25rem"
      }
    },
  },
  plugins: [],
};
