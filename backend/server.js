// backend/server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

console.log('API_KEY está definida?', API_KEY ? 'Sim' : 'Não');

if (!API_KEY) {
  console.error("⚠️ API_KEY não definida. Verifique seu .env ou variável no Render.");
  process.exit(1);
}

app.use(cors());

app.get('/weather', async (req, res) => {
  const { lat, lon, city } = req.query;

  let url;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
  } else {
    return res.status(400).json({ error: 'Parâmetros inválidos. Use lat+lon ou city.' });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.status !== 200) {
      // Retorna erro do OpenWeather (ex: 401, 404)
      return res.status(response.status).json({ error: data.message || 'Erro na API do OpenWeather' });
    }

    res.json(data);

  } catch (error) {
    console.error("Erro no servidor:", error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
