import { CACHE_KEY } from './config.js';
import { Cards } from './cards.js';

const maxHistoryItems = 5;

const HistoricoFavoritos = {
  render() {
    this.renderHistorico();
    this.renderFavoritos();
  },

  getCache() {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  },

  saveCache(cache) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  },

  adicionarHistorico(cidadeObj) {
    const cache = this.getCache();
    if (!cache.historico) cache.historico = [];

    // Remove duplicado
    cache.historico = cache.historico.filter(c => c.nome !== cidadeObj.nome || c.estadoSigla !== cidadeObj.estadoSigla);

    cache.historico.unshift(cidadeObj);
    if (cache.historico.length > maxHistoryItems) cache.historico.pop();

    this.saveCache(cache);
    this.renderHistorico();
  },

  renderHistorico() {
    const container = document.getElementById('historico-container');
    container.innerHTML = '';
    const cache = this.getCache();
    const historico = cache.historico || [];

    historico.forEach(cidade=>{
      const btn = document.createElement('button');
      btn.textContent = `${cidade.nome} - ${cidade.estadoSigla}`;
      btn.className = 'historico-btn';
      btn.addEventListener('click', ()=>Cards.consultarMunicipio(cidade));
      container.appendChild(btn);
    });
  },

  adicionarFavorito(cidadeObj) {
    const cache = this.getCache();
    if (!cache.favoritos) cache.favoritos = [];

    // Remove duplicado
    cache.favoritos = cache.favoritos.filter(c => c.nome !== cidadeObj.nome || c.estadoSigla !== cidadeObj.estadoSigla);
    cache.favoritos.unshift(cidadeObj);

    this.saveCache(cache);
    this.renderFavoritos();
  },

  renderFavoritos() {
    const container = document.getElementById('favoritos-container');
    container.innerHTML = '';
    const cache = this.getCache();
    const favoritos = cache.favoritos || [];

    favoritos.forEach(cidade=>{
      const btn = document.createElement('button');
      btn.textContent = `${cidade.nome} - ${cidade.estadoSigla}`;
      btn.className = 'favorito-btn';
      btn.addEventListener('click', ()=>Cards.consultarMunicipio(cidade));
      container.appendChild(btn);
    });
  }
};

export { HistoricoFavoritos, maxHistoryItems };
