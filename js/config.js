// ================== Configurações ==================

// URL do backend de previsão do tempo
const backendUrl = 'https://weather-backend-hh3w.onrender.com/forecast';

// Chaves do localStorage
const CACHE_KEY = 'ibge_cache';
const STORAGE_KEY = 'previsao_app';

// Validade do cache (em ms) - 1 semana
const CACHE_VALIDITY = 7 * 24 * 60 * 60 * 1000;

// Horários desejados para exibir previsão
const horariosDesejados = [
  '00:00:00',
  '06:00:00',
  '12:00:00',
  '18:00:00',
  '21:00:00',
];

// Horários convertidos para array numérico [hora, min, seg]
const horariosNumericos = horariosDesejados.map((h) =>
  h.split(':').map((v) => parseInt(v, 10))
);

// Última consulta (privada)
let lastConsulta = 0;

// Getter/Setter para controlar a última consulta
const getLastConsulta = () => lastConsulta;
const setLastConsulta = (value) => {
  lastConsulta = value;
};

// ================== Exportações ==================
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
