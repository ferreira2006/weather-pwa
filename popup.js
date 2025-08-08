const API_KEY = "SUA_API_KEY_AQUI"; // Coloque sua chave do OpenWeatherMap aqui

const titulo = document.querySelector('h1');
const forecastContainer = document.getElementById('forecast');
const cityInput = document.getElementById('cityInput');
const cityForm = document.getElementById('cityForm');
const message = document.getElementById('message');

async function fetchWeather(city) {
  forecastContainer.textContent = 'Carregando previsão para ' + city + '...';
  message.textContent = '';
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},BR&appid=${API_KEY}&units=metric&lang=pt_br`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== "200") {
      forecastContainer.textContent = '';
      message.textContent = `Erro: ${data.message}`;
      titulo.textContent = "Previsão do Tempo";
      return;
    }

    // Atualiza título com nome da cidade
    titulo.textContent = `Previsão do Tempo - ${data.city.name}`;

    const previsoesDiarias = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 3);
    forecastContainer.innerHTML = '';

    previsoesDiarias.forEach(item => {
      const dataObj = new Date(item.dt_txt);
      const dataFormatada = dataObj.toLocaleDateString("pt-BR");
      const diaSemana = dataObj.toLocaleDateString("pt-BR", { weekday: "long" });
      const temp = Math.round(item.main.temp);
      const descricao = item.weather[0].description;
      const icone = item.weather[0].icon;

      forecastContainer.innerHTML += `
        <div class="card">
          <h3>${dataFormatada}</h3>
          <p class="dia-semana">${diaSemana}</p>
          <img src="https://openweathermap.org/img/wn/${icone}@2x.png" alt="${descricao}">
          <p><strong>${temp}°C</strong></p>
          <p>${descricao}</p>
        </div>
      `;
    });

  } catch (error) {
    forecastContainer.textContent = 'Erro ao buscar previsão.';
    message.textContent = 'Erro na conexão. Tente novamente.';
    titulo.textContent = "Previsão do Tempo";
    console.error(error);
  }
}

// Tenta pegar localização do usuário e buscar a previsão automaticamente
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();
        if (geoData.length === 0) throw new Error('Cidade não encontrada na localização.');
        const cityName = geoData[0].name;
        fetchWeather(cityName);
        cityInput.value = cityName; // preenche o input para o usuário
      } catch (e) {
        console.error(e);
        message.textContent = 'Erro ao detectar cidade pela localização. Use o campo abaixo.';
      }
    },
    (error) => {
      console.warn('Permissão negada ou erro na geolocalização:', error);
      message.textContent = 'Permissão negada para localização. Use o campo abaixo.';
    }
  );
} else {
  message.textContent = 'Navegador não suporta geolocalização. Use o campo abaixo.';
}

// Form submit para busca via Enter ou clique no botão
cityForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city.length === 0) {
    message.textContent = 'Por favor, informe uma cidade.';
    return;
  }
  fetchWeather(city);
});
