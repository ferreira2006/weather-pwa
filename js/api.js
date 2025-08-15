
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

export const WeatherAPI = {
  async fetchByCity(city) {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=1`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    return res.json();
  },

  async fetchByCoords(lat, lon) {
    const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}&days=1`);
    if (!res.ok) throw new Error("Não foi possível obter o clima para sua localização.");
    return res.json();
  }
};
