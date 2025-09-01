import {
  STORAGE_KEY,
  CACHE_KEY,
  CACHE_VALIDITY,
  getLastConsulta,
  setLastConsulta,
} from './config.js';

// Função para carregar dados do localStorage com fallback
const _loadFromStorage = (key, defaultValue) => {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Função para salvar dados no localStorage
const _saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Função para verificar a validade do cache
const _isCacheValid = (timestamp) => Date.now() - (timestamp ?? 0) < CACHE_VALIDITY;

const StorageManager = {
  // Carregar dados gerais (historico e favoritos)
  carregar() {
    const data = _loadFromStorage(STORAGE_KEY, {});
    return {
      historico: Array.isArray(data?.historico) ? data.historico : [],
      favoritos: Array.isArray(data?.favoritos) ? data.favoritos : [],
    };
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
    const cache = { ...(data ?? {}), timestamp: Date.now() };
    _saveToStorage(CACHE_KEY, cache);
  },

  // Verificar validade do cache
  isCacheValid() {
    const cached = _loadFromStorage(CACHE_KEY, {});
    return _isCacheValid(cached?.timestamp);
  },

  // Adicionar ou remover favorito
  toggleFavorito(cidadeObj) {
    if (!cidadeObj?.nome) return false;

    const data = this.carregar();
    const index = data.favoritos.findIndex(
      (m) => m?.nome === cidadeObj?.nome && m?.estadoId === cidadeObj?.estadoId
    );

    if (index >= 0) {
      data.favoritos.splice(index, 1);
    } else {
      if (data.favoritos.length >= 5) return false;
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
