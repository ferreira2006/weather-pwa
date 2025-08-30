// ================== Configurações ==================
export const backendUrl = 'https://weather-backend-hh3w.onrender.com/forecast';
export const CACHE_KEY = 'ibge_cache';
export const STORAGE_KEY = 'previsao_app';
export const CACHE_VALIDITY = 7 * 24 * 60 * 60 * 1000; // 1 semana
export const maxHistoryItems = 5;
export const horariosDesejados = [
  '00:00:00',
  '06:00:00',
  '12:00:00',
  '18:00:00',
  '21:00:00',
];
export const horariosNumericos = horariosDesejados.map((h) =>
  h.split(':').map(Number)
);
export let lastConsulta = 0; // controle de consultas rápidas
