/** @type {import('tailwindcss').Config} */
export default {
  content: ['./example/*.html', './example/**/*.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        style_str: '#008800',
        style_blue: '#000088',
        style_num: '#006666',
        style_class: '#660066',
        style_comment: '#800',
      },
    },
  },
  plugins: [],
};
