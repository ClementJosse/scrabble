/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'lightblue': '#E6F6FF',
        'blue': '#68AEFF',
        'strongblue': '#193AB7',
        'lightred': '#FFEBEB',
        'red': '#FF686C',
        'strongred': '#830C41',
        'base1': '#FFFAF3',
        'base2': '#FFF1DE',
        'base3': '#FFD5A4',
        'primary': '#AE3D00',
        'secondary': '#FFA63F'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
    plugins: [
      require('tailwind-scrollbar'),
    ],

  }
}