// ================== Importando os módulos ==================
import { Toast } from './toasts.js';
import { Theme } from './theme.js';
import { HistoricoFavoritos } from './historicoFavoritos.js';
import { IBGE } from './ibge.js';
import { Cards } from './cards.js';

// ================== Configurações ==================
const horariosDesejados = [
  '00:00:00',
  '06:00:00',
  '12:00:00',
  '18:00:00',
  '21:00:00',
];

// ================== Inicialização ==================
// Carregar o tema salvo
Theme.load();

// Carregar estados do IBGE
IBGE.carregarEstados();

// Renderizar histórico e favoritos
HistoricoFavoritos.render();

// ================== Eventos ==================

// Evento de mudança no select de estado
document
  .getElementById('estado-select')
  .addEventListener('change', async (e) => {
    const estadoId = e.target.value;
    await IBGE.carregarMunicipios(estadoId);
  });

// Evento de clique no botão "Consultar"
document.getElementById('consultar-btn').addEventListener('click', () => {
  const municipioSelect = document.getElementById('municipio-select');
  const estadoSelect = document.getElementById('estado-select');

  if (!municipioSelect.value || !estadoSelect.value) {
    Toast.show('Selecione estado e município antes de consultar.');
    return;
  }

  const estadoOption = estadoSelect.options[estadoSelect.selectedIndex];
  const cidadeObj = {
    nome: municipioSelect.value,
    estadoId: estadoSelect.value,
    estadoSigla: estadoOption.dataset.sigla || '',
  };

  Cards.consultarMunicipio(cidadeObj);
});

// ================== Botão Voltar ao Topo ==================
const scrollTopButton = document.getElementById('back-to-top');
scrollTopButton.style.display = 'none'; // Inicialmente escondido

// Mostrar o botão quando o usuário rolar para baixo
window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    scrollTopButton.style.display = 'flex';
  } else {
    scrollTopButton.style.display = 'none';
  }
});

// Evento de clique no botão "Voltar ao topo"
scrollTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Evento de alternar tema
document.getElementById('theme-toggle').addEventListener('click', () => {
  Theme.toggle(); // Alterna o tema
});
