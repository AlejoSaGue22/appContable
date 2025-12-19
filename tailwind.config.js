/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Esto lee tus archivos de Angular
    "./node_modules/flowbite-angular/**/*.js" // <-- Esto es para Flowbite-Angular
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin') // <-- Así se añade el plugin
  ],
};