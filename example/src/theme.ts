// Set the theme based on localStorage value
const removeTheme = () => {
  document.documentElement.classList.remove('dark');
};

const addTheme = () => {
  document.documentElement.classList.add('dark');
};

(() => {
  const theme = localStorage.getItem('theme') || 'dark';
  console.log(theme);
  if (theme === 'dark') return addTheme();
  removeTheme();
})();
