// ================== StorageManager ==================
import {
  STORAGE_KEY,
  CACHE_KEY,
  CACHE_VALIDITY,
  getLastConsulta,
  setLastConsulta,
} from './config.js';

// Função para carregar dados do localStorage com fallback
const _loadFromStorage = (key, defaultValue) => {
  const savedData = localStorage.getItem(key);
  return savedData ? JSON.parse(savedData) : defaultValue;
};

// Função para salvar dados no localStorage
const _saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Função para verificar a validade do cache
const _isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_VALIDITY;
};

const StorageManager = {
  // Carregar dados gerais (historico e favoritos)
  carregar() {
    return _loadFromStorage(STORAGE_KEY, { historico: [], favoritos: [] });
  },

  // Salvar dados gerais (historico e favoritos)
  salvar(data) {
    _saveToStorage(STORAGE_KEY, data);
  },

  // Carregar cache (para estados e municípios)
  carregarCache() {
    return _loadFromStorage(CACHE_KEY, {});
  },

  // Salvar cache (para estados e municípios)
  salvarCache(data) {
    const cache = _loadFromStorage(CACHE_KEY, {});
    cache.timestamp = Date.now(); // Atualiza timestamp de validade
    _saveToStorage(CACHE_KEY, cache);
  },

  // Verificar validade do cache
  isCacheValid() {
    const cached = _loadFromStorage(CACHE_KEY, {});
    return cached.timestamp && _isCacheValid(cached.timestamp);
  },

  // Adicionar ou remover favorito
  toggleFavorito(cidadeObj) {
    const data = this.carregar();
    const index = data.favoritos.findIndex(
      (m) => m.nome === cidadeObj.nome && m.estadoId === cidadeObj.estadoId
    );

    if (index >= 0) {
      // Remove do favoritos
      data.favoritos.splice(index, 1);
    } else {
      // Adiciona aos favoritos
      if (data.favoritos.length >= 5) return false; // Limite de 5 favoritos
      data.favoritos.push(cidadeObj);
    }

    this.salvar(data);
    return true;
  },

  // Obter a última consulta
  getLastConsulta() {
    return getLastConsulta();
  },

  // Definir a última consulta
  setLastConsulta(value) {
    setLastConsulta(value);
  },
};

export { StorageManager };
