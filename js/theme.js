// ================== Theme ==================
const Theme = (() => {
  // Método privado para definir o tema
  const _setTheme = (theme) => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark'); // Remover classes antigas
    html.classList.add(theme); // Adicionar nova classe
    localStorage.setItem('theme', theme); // Salvar no localStorage
  };

  // Método privado para atualizar o ícone do botão
  const _updateButtonIcon = (theme) => {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  };

  return {
    // Alterna entre os temas claro e escuro
    toggle() {
      const currentTheme = document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      _setTheme(newTheme);
      _updateButtonIcon(newTheme);
    },

    // Carrega o tema salvo no localStorage
    load() {
      const savedTheme = localStorage.getItem('theme') ?? 'light';
      _setTheme(savedTheme);
      _updateButtonIcon(savedTheme);
    },
  };
})();

export { Theme };
