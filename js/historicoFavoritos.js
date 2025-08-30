// ================== Histórico e Favoritos ==================
import { StorageManager } from './storageManager.js';
import { Toast } from './toast.js';

export const HistoricoFavoritos = {
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

  render() {
    const data = StorageManager.carregar();
    // Renderizar histórico
    const historicoContainer = document.getElementById('historico-container');
    historicoContainer.innerHTML = '';
    historicoContainer.setAttribute('aria-live', 'polite');
    const histFrag = document.createDocumentFragment();
    data.historico.forEach((m) =>
      histFrag.appendChild(this.criarBotaoMunicipio(m, 'historico-container'))
    );
    historicoContainer.appendChild(histFrag);

    // Renderizar favoritos
    const favContainer = document.getElementById('favoritos-container');
    favContainer.innerHTML = '';
    favContainer.setAttribute('aria-live', 'polite');
    const favFrag = document.createDocumentFragment();
    data.favoritos.forEach((m) =>
      favFrag.appendChild(this.criarBotaoMunicipio(m, 'favoritos-container'))
    );
    favContainer.appendChild(favFrag);
  },

  criarBotaoMunicipio(cidadeObj, containerId) {
    // Criação do botão para o município (similar ao seu código atual)
  },
};
