/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 50:'#f0f0ff',100:'#e0e0ff',200:'#c4b5fd',300:'#a78bfa',400:'#8b5cf6',500:'#7c3aed',600:'#6d28d9',700:'#5b21b6',800:'#4c1d95',900:'#2e1065' },
        accent: { 400:'#38bdf8',500:'#0ea5e9',600:'#0284c7' },
      },
      fontFamily: { sans: ['DM Sans','ui-sans-serif','system-ui'] },
    },
  },
  plugins: [],
}
