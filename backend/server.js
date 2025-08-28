require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

console.log("API_KEY está definida?", API_KEY ? "Sim" : "Não");

if (!API_KEY) {
  console.error("⚠️ API_KEY não definida. Verifique seu .env ou variável no Render.");
  process.exit(1);
}

app.use(cors());

// --- CACHE EM MEMÓRIA ---
const cache = {};
const WEATHER_TTL = 10 * 60 * 1000; // 10 minutos
const FORECAST_TTL = 30 * 60 * 1000; // 30 minutos

// --- FUNÇÃO PARA BUSCAR DADOS COM CACHE ---
async function fetchWithCache(key, url, ttl) {
  const now = Date.now();
  if (cache[key] && (now - cache[key].timestamp < ttl)) {
    console.log(`Cache hit: ${key}`);
    return cache[key].data;
  }

  console.log(`Cache miss: ${key}, buscando na API`);
  const response = await fetch(url);
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(data.message || 'Erro na API do OpenWeather');
  }

  cache[key] = { data, timestamp: now };
  return data;
}

// --- ROTA /weather ---
app.get('/weather', async (req, res) => {
  const { lat, lon, city } = req.query;

  if (!lat && !lon && !city) {
    return res.status(400).json({ error: 'Parâmetros inválidos. Use lat+lon ou city.' });
  }

  let url, key;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
    key = `${lat},${lon}`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
    key = city.toLowerCase();
  }

  try {
    const data = await fetchWithCache(key, url, WEATHER_TTL);
    res.json(data);
  } catch (err) {
    console.error("Erro /weather:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- ROTA /forecast ---
app.get('/forecast', async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'Parâmetros inválidos. Use city.' });
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
  const key = `forecast_${city.toLowerCase()}`;

  try {
    const data = await fetchWithCache(key, url, FORECAST_TTL);
    res.json(data);
  } catch (err) {
    console.error("Erro /forecast:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
