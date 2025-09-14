/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    // Nueva ruta para incluir las clases de Material Tailwind
    "./node_modules/@material-tailwind/html/dist/**/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

