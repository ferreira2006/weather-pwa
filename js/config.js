// ================== Configurações gerais ==================
const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";
const CACHE_KEY = "previsao_app";
const CACHE_VALIDITY = 1000 * 60 * 60 * 2; // 2 horas

// Horários desejados (para filtrar da API)
const horariosNumericos = [
  [0, 0, 0],
  [6, 0, 0],
  [12, 0, 0],
  [18, 0, 0],
  [21, 0, 0],
];

// Controle de última consulta (para debounce)
let lastConsulta = 0;
const getLastConsulta = () => lastConsulta;
const setLastConsulta = (ts) => { lastConsulta = ts; };

export {
  backendUrl,
  CACHE_KEY,
  CACHE_VALIDITY,
  horariosNumericos,
  getLastConsulta,
  setLastConsulta
};
