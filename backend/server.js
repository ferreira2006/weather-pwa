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

// Função para buscar clima atual
async function fetchCurrentWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
  const res = await fetch(url);
  const data = await res.json();
  if (res.status !== 200) throw new Error(data.message || 'Erro na API do OpenWeather');
  return data;
}

// Função para buscar forecast 5 dias usando One Call
async function fetchForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&lang=pt_br&appid=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (res.cod && res.cod !== 200) throw new Error(data.message || 'Erro no forecast');
  return data.daily.slice(0, 6); // Retorna 6 dias (hoje + 5 dias)
}

// Endpoint principal
app.get('/weather', async (req, res) => {
  const { city, lat, lon } = req.query;

  try {
    let currentData, dailyForecast;

    if (city) {
      currentData = await fetchCurrentWeather(city);
      dailyForecast = await fetchForecast(currentData.coord.lat, currentData.coord.lon);
    } else if (lat && lon) {
      const coordCityUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
      const coordRes = await fetch(coordCityUrl);
      currentData = await coordRes.json();
      if (coordRes.status !== 200) throw new Error(currentData.message || 'Erro na API do OpenWeather');
      dailyForecast = await fetchForecast(lat, lon);
    } else {
      return res.status(400).json({ error: 'Parâmetros inválidos. Use city ou lat+lon.' });
    }

    // Retorna dados já preparados para o app
    res.json({
      name: currentData.name,
      sys: currentData.sys,
      coord: currentData.coord,
      main: currentData.main,
      weather: currentData.weather,
      wind: currentData.wind,
      forecast: dailyForecast
    });

  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
