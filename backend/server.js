require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("⚠️ API_KEY não definida. Verifique seu .env ou variável no Render.");
  process.exit(1);
}

app.use(cors());

// Cache simples em memória
// { key: { timestamp: <ms>, data: <JSON> } }
const cache = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

function getCacheKey({ city, lat, lon }) {
  if (city) return `city:${city.toLowerCase()}`;
  if (lat && lon) return `coords:${lat},${lon}`;
  return null;
}

async function fetchCurrentWeather({ city, lat, lon }) {
  let url;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
  } else {
    throw { status: 400, message: 'Parâmetros inválidos. Use lat+lon ou city.' };
  }

  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.message || "Erro na API de clima" };
  return data;
}

async function fetchForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${API_KEY}&units=metric&lang=pt_br`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw { status: response.status, message: data.message || "Erro na API de forecast" };
  return data;
}

// Endpoint unificado com cache
app.get('/weather', async (req, res) => {
  const { city, lat, lon } = req.query;
  const key = getCacheKey({ city, lat, lon });

  if (key && cache[key] && (Date.now() - cache[key].timestamp < CACHE_DURATION)) {
    return res.json(cache[key].data);
  }

  try {
    const current = await fetchCurrentWeather({ city, lat, lon });
    const latitude = current.coord.lat;
    const longitude = current.coord.lon;

    const forecastData = await fetchForecast(latitude, longitude);

    const result = {
      name: current.name,
      sys: { country: current.sys.country },
      main: {
        temp: current.main.temp,
        feels_like: current.main.feels_like,
        humidity: current.main.humidity
      },
      wind: { speed: current.wind.speed },
      weather: current.weather,
      daily: forecastData.daily // forecast 5 dias
    };

    if (key) {
      cache[key] = { timestamp: Date.now(), data: result };
    }

    res.json(result);

  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor híbrido com cache rodando na porta ${PORT}`);
});
