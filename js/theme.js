// ================== Theme ==================
export const Theme = {
  toggle() {
    const html = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    const isDark = html.classList.contains('dark');

    if (isDark) {
      html.classList.replace('dark', 'light');
      localStorage.setItem('theme', 'light');
      btn.textContent = '🌙';
    } else {
      html.classList.replace('light', 'dark');
      localStorage.setItem('theme', 'dark');
      btn.textContent = '☀️';
    }
  },

  load() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.add(saved);
    const btn = document.getElementById('theme-toggle');
    btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  },
};
