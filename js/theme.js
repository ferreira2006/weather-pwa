// ================== Theme ==================
const Theme = (() => {
  // Método privado para definir o tema
  const _setTheme = (theme) => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark'); // Remover as classes antigas
    html.classList.add(theme); // Adicionar a nova classe
    localStorage.setItem('theme', theme); // Salvar no localStorage
  };

  // Método privado para atualizar o ícone do botão
  const _setButtonIcon = (theme) => {
    const btn = document.getElementById('theme-toggle');
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  };

  return {
    // Alterna entre os temas claro e escuro
    toggle() {
      const currentTheme = document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      _setTheme(newTheme); // Definir o novo tema
      _setButtonIcon(newTheme); // Atualizar o ícone do botão
    },

    // Carrega o tema salvo no localStorage
    load() {
      const savedTheme = localStorage.getItem('theme') || 'light'; // Carregar tema salvo ou 'light' por padrão
      _setTheme(savedTheme); // Aplicar o tema salvo
      _setButtonIcon(savedTheme); // Atualizar o ícone do botão
    },
  };
})();

export { Theme };
