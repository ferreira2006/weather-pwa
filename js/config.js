// ================== Configurações ==================
const backendUrl = 'https://weather-backend-hh3w.onrender.com/forecast';
const CACHE_KEY = 'ibge_cache';
const STORAGE_KEY = 'previsao_app';
const CACHE_VALIDITY = 7 * 24 * 60 * 60 * 1000; // 1 semana

const horariosDesejados = [
  '00:00:00',
  '06:00:00',
  '12:00:00',
  '18:00:00',
  '21:00:00',
];
const horariosNumericos = horariosDesejados.map((h) =>
  h.split(':').map(Number)
);

let lastConsulta = 0;

// Função para obter e setar o valor de `lastConsulta`
const getLastConsulta = () => lastConsulta;
const setLastConsulta = (value) => {
  lastConsulta = value;
};

export {
  STORAGE_KEY,
  CACHE_KEY,
  CACHE_VALIDITY,
  backendUrl,
  horariosDesejados,
  horariosNumericos,
  getLastConsulta,
  setLastConsulta,
};
