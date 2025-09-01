// ================== Importando os módulos ==================
import { Toast } from './toasts.js';
import { Theme } from './theme.js';
import { HistoricoFavoritos } from './historicoFavoritos.js';
import { IBGE } from './ibge.js';
import { Cards } from './cards.js';
import { StorageManager } from './storageManager.js';

// ================== Configurações ==================
const horariosDesejados = [
  '00:00:00',
  '06:00:00',
  '12:00:00',
  '18:00:00',
  '21:00:00',
];

// ================== Elementos do DOM ==================
const estadoSelect = document.getElementById('estado-select');
const municipioSelect = document.getElementById('municipio-select');
const consultarBtn = document.getElementById('consultar-btn');
const scrollTopButton = document.getElementById('back-to-top');
const themeToggleBtn = document.getElementById('theme-toggle');

// ================== Inicialização ==================

// Carregar o tema salvo
Theme.load();

// Carregar estados do IBGE
IBGE.carregarEstados();

// Inicialização segura do Storage
const storageInicial = StorageManager.carregar() || {};
StorageManager.salvar({
  historico: Array.isArray(storageInicial.historico) ? storageInicial.historico : [],
  favoritos: Array.isArray(storageInicial.favoritos) ? storageInicial.favoritos : [],
});

// Renderizar histórico e favoritos
HistoricoFavoritos.render();

// ================== Eventos ==================

if (estadoSelect) {
  estadoSelect.addEventListener('change', async (e) => {
    try {
      const estadoId = e.target.value;
      await IBGE.carregarMunicipios(estadoId);
    } catch (err) {
      console.error(err);
      Toast.show('Erro ao carregar municípios.');
    }
  });
}

if (consultarBtn && municipioSelect && estadoSelect) {
  consultarBtn.addEventListener('click', () => {
    if (!municipioSelect.value || !estadoSelect.value) {
      Toast.show('Selecione estado e município antes de consultar.');
      return;
    }

    const estadoOption = estadoSelect.options[estadoSelect.selectedIndex];
    const cidadeObj = {
      nome: municipioSelect.value,
      estadoId: estadoSelect.value,
      estadoSigla: estadoOption?.dataset?.sigla || '',
    };

    Cards.consultarMunicipio(cidadeObj);
  });
}

// ================== Botão Voltar ao Topo ==================
if (scrollTopButton) {
  scrollTopButton.style.display = 'none'; // Inicialmente escondido

  window.addEventListener('scroll', () => {
    scrollTopButton.style.display = window.scrollY > 200 ? 'flex' : 'none';
  });

  scrollTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ================== Alternar tema ==================
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    Theme.toggle();
  });
}
