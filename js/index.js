import { Theme } from './theme.js';
import { IBGE } from './ibge.js';
import { HistoricoFavoritos } from './historicoFavoritos.js';
import { Cards } from './cards.js';

document
  .getElementById('theme-toggle')
  .addEventListener('click', () => Theme.toggle());
document
  .getElementById('estado-select')
  .addEventListener('change', async (e) => {
    const estadoId = e.target.value;
    await IBGE.carregarMunicipios(estadoId);
  });

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

Theme.load();
IBGE.carregarEstados();
HistoricoFavoritos.render();
