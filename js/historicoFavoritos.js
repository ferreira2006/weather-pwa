import { StorageManager } from './storageManager.js';
import { IBGE } from './ibge.js';
import { Cards } from './cards.js';
import { Toast } from './toasts.js';

const maxHistoryItems = 5;

const HistoricoFavoritos = {
  adicionarHistorico(cidadeObj) {
    if (!cidadeObj?.nome) return;

    const data = StorageManager.carregar();
    data.historico = Array.isArray(data.historico) ? data.historico : [];
    data.historico = data.historico.filter(
      (m) => m?.nome !== cidadeObj.nome || m?.estadoId !== cidadeObj.estadoId
    );
    data.historico.unshift(cidadeObj);
    if (data.historico.length > maxHistoryItems) data.historico.pop();
    StorageManager.salvar(data);
    this.render();
  },

  toggleFavorito(cidadeObj) {
    if (!cidadeObj?.nome) return;

    const data = StorageManager.carregar();
    data.favoritos = Array.isArray(data.favoritos) ? data.favoritos : [];
    const index = data.favoritos.findIndex(
      (m) => m?.nome === cidadeObj.nome && m?.estadoId === cidadeObj.estadoId
    );

    if (index >= 0) {
      data.favoritos.splice(index, 1);
      Toast.show(`${cidadeObj.nome} removido dos favoritos!`, 'remove');
    } else {
      if (data.favoritos.length >= 5) {
        Toast.show('Máximo de 5 favoritos!', 'default');
        return;
      }
      data.favoritos.push(cidadeObj);
      Toast.show(`${cidadeObj.nome} adicionado aos favoritos!`, 'add');
    }

    StorageManager.salvar(data);
    this.render();
  },

  criarBotaoMunicipio(cidadeObj, containerId) {
    if (!cidadeObj?.nome) return document.createElement('div');

    const btn = document.createElement('button');
    btn.textContent = `${cidadeObj.nome} - ${cidadeObj.estadoSigla ?? ''}`;
    btn.className = 'municipio-btn';
    btn.setAttribute(
      'aria-label',
      `Selecionar município ${cidadeObj.nome} - ${cidadeObj.estadoSigla ?? ''}`
    );
    btn.addEventListener('click', () => {
      if (!cidadeObj?.estadoId) return;
      document.getElementById('estado-select').value = cidadeObj.estadoId;
      IBGE.carregarMunicipios(cidadeObj.estadoId).then(() => {
        document.getElementById('municipio-select').value = cidadeObj.nome;
        Cards.consultarMunicipio(cidadeObj);
      });
    });

    const btnFav = document.createElement('button');
    const storage = StorageManager.carregar();
    const isFav = (storage?.favoritos ?? []).some(
      (f) => f?.nome === cidadeObj?.nome && f?.estadoId === cidadeObj?.estadoId
    );
    btnFav.textContent = containerId === 'historico-container' ? '📌' : '❌';
    btnFav.className = `favorito-btn ${isFav ? 'favorito' : 'nao-favorito'}`;
    btnFav.setAttribute(
      'aria-label',
      isFav
        ? `Remover ${cidadeObj.nome} dos favoritos`
        : `Adicionar ${cidadeObj.nome} aos favoritos`
    );

    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    btnFav.appendChild(tooltip);

    btnFav.addEventListener('click', (e) => {
      e.stopPropagation();
      HistoricoFavoritos.toggleFavorito(cidadeObj);
      const novoFav = btnFav.classList.contains('favorito');
      tooltip.textContent = novoFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
      btnFav.setAttribute(
        'aria-label',
        novoFav
          ? `Remover ${cidadeObj.nome} dos favoritos`
          : `Adicionar ${cidadeObj.nome} aos favoritos`
      );
    });

    const div = document.createElement('div');
    div.className = 'button-container';
    div.append(btn, btnFav);
    return div;
  },

  render() {
    const data = StorageManager.carregar();
    const historico = Array.isArray(data?.historico) ? data.historico : [];
    const favoritos = Array.isArray(data?.favoritos) ? data.favoritos : [];

    const historicoContainer = document.getElementById('historico-container');
    if (historicoContainer) {
      historicoContainer.innerHTML = '';
      historicoContainer.setAttribute('aria-live', 'polite');
      const frag = document.createDocumentFragment();
      historico.forEach((m) => frag.appendChild(this.criarBotaoMunicipio(m, 'historico-container')));
      historicoContainer.appendChild(frag);
    }

    const favContainer = document.getElementById('favoritos-container');
    if (favContainer) {
      favContainer.innerHTML = '';
      favContainer.setAttribute('aria-live', 'polite');
      const frag = document.createDocumentFragment();
      favoritos.forEach((m) => frag.appendChild(this.criarBotaoMunicipio(m, 'favoritos-container')));
      favContainer.appendChild(frag);
    }
  },
};

export { HistoricoFavoritos, maxHistoryItems };
