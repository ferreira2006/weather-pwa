// backend/server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(cors());

// Rota para buscar dados do clima
app.get('/weather', async (req, res) => {
    const { lat, lon, city } = req.query;
    let url = '';

    if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
    } else if (city) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${city},BR&appid=${API_KEY}&units=metric&lang=pt_br`;
    } else {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do clima' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
