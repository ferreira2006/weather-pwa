// ================== Histórico e Favoritos ==================

import { StorageManager } from './storageManager.js';
import { IBGE } from './ibge.js';
import { Cards } from './cards.js';
import { Toast } from './toasts.js';

const maxHistoryItems = 5;

const HistoricoFavoritos = {
  adicionarHistorico(cidadeObj) {
    const data = StorageManager.carregar();
    data.historico = data.historico.filter(
      (m) => m.nome !== cidadeObj.nome || m.estadoId !== cidadeObj.estadoId
    );
    data.historico.unshift(cidadeObj);
    if (data.historico.length > maxHistoryItems) data.historico.pop();
    StorageManager.salvar(data);
    this.render();
  },

  toggleFavorito(cidadeObj) {
    const data = StorageManager.carregar();
    const index = data.favoritos.findIndex(
      (m) => m.nome === cidadeObj.nome && m.estadoId === cidadeObj.estadoId
    );
    if (index >= 0) {
      data.favoritos.splice(index, 1);
      Toast.show(`${cidadeObj.nome} removido dos favoritos!`, 'remove');
    } else {
      if (data.favoritos.length >= 5)
        return Toast.show('Máximo de 5 favoritos!', 'default');
      data.favoritos.push(cidadeObj);
      Toast.show(`${cidadeObj.nome} adicionado aos favoritos!`, 'add');
    }
    StorageManager.salvar(data);
    this.render();
  },

  criarBotaoMunicipio(cidadeObj, containerId) {
    const btn = document.createElement('button');
    btn.textContent = `${cidadeObj.nome} - ${cidadeObj.estadoSigla}`;
    btn.className = 'municipio-btn';
    btn.setAttribute(
      'aria-label',
      `Selecionar município ${cidadeObj.nome} - ${cidadeObj.estadoSigla}`
    );
    btn.addEventListener('click', () => {
      document.getElementById('estado-select').value = cidadeObj.estadoId;
      IBGE.carregarMunicipios(cidadeObj.estadoId).then(() => {
        document.getElementById('municipio-select').value = cidadeObj.nome;
        Cards.consultarMunicipio(cidadeObj);
      });
    });

    const btnFav = document.createElement('button');
    const storage = StorageManager.carregar();
    const isFav = storage.favoritos.some(
      (f) => f.nome === cidadeObj.nome && f.estadoId === cidadeObj.estadoId
    );
    btnFav.textContent = containerId === 'historico-container' ? '📌' : '❌';
    btnFav.className = `favorito-btn ${isFav ? 'favorito' : 'nao-favorito'}`;
    btnFav.setAttribute(
      'aria-label',
      isFav
        ? `Remover ${cidadeObj.nome} dos favoritos`
        : `Adicionar ${cidadeObj.nome} aos favoritos`
    );

    // Criando o tooltip
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = isFav
      ? 'Remover dos favoritos'
      : 'Adicionar aos favoritos';
    btnFav.appendChild(tooltip);

    // Atualiza o tooltip ao clicar no botão
    btnFav.addEventListener('click', (e) => {
      e.stopPropagation();
      HistoricoFavoritos.toggleFavorito(cidadeObj);

      // Atualiza o tooltip dinamicamente
      const novoFav = btnFav.classList.contains('favorito');
      tooltip.textContent = novoFav
        ? 'Remover dos favoritos'
        : 'Adicionar aos favoritos';
      btnFav.setAttribute(
        'aria-label',
        novoFav
          ? `Remover ${cidadeObj.nome} dos favoritos`
          : `Adicionar ${cidadeObj.nome} aos favoritos`
      );
    });

    const div = document.createElement('div');
    div.className = 'button-container';
    div.appendChild(btn);
    div.appendChild(btnFav);
    return div;
  },

  render() {
    const data = StorageManager.carregar();

    // Histórico
    const historicoContainer = document.getElementById('historico-container');
    historicoContainer.innerHTML = '';
    historicoContainer.setAttribute('aria-live', 'polite');
    const histFrag = document.createDocumentFragment();
    data.historico.forEach((m) =>
      histFrag.appendChild(this.criarBotaoMunicipio(m, 'historico-container'))
    );
    historicoContainer.appendChild(histFrag);

    // Favoritos
    const favContainer = document.getElementById('favoritos-container');
    favContainer.innerHTML = '';
    favContainer.setAttribute('aria-live', 'polite');
    const favFrag = document.createDocumentFragment();
    data.favoritos.forEach((m) =>
      favFrag.appendChild(this.criarBotaoMunicipio(m, 'favoritos-container'))
    );
    favContainer.appendChild(favFrag);
  },
};

// Exportando o módulo HistoricoFavoritos
export { HistoricoFavoritos, maxHistoryItems };
