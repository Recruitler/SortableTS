/** @type {import('tailwindcss').Config} */
export default {
  content: ['./example/*.html', './example/**/*.html'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        style_str: '#008800',
        style_blue: '#000088',
        style_num: '#006666',
        style_class: '#660066',
        style_comment: '#800',
        style_blue_dark: '#8800ff',
        style_class_dark: '#ff00ff',
        style_str_dark: '#00ff00',
        style_num_dark: '#00ffff',
        style_comment_dark: '#ff8000',
      },
      
    },
  },
  plugins: [],
};
