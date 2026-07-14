/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores inspirados en HLTV Dark Mode
        hltv: {
          bg: '#1b1e23',       // Fondo principal
          header: '#242930',   // Fondo del NavBar y tarjetas
          accent: '#2e74aa',   // Azul HLTV clásico
          accentHover: '#3b8cc7', 
          text: '#c9ccd0',     // Texto secundario
          textLight: '#ffffff', // Texto principal
          border: '#353a42'    // Bordes sutiles
        }
      }
    },
  },
  plugins: [],
}
