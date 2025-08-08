const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const weatherDiv = document.getElementById('weather');
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('city');

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeatherByCity(city);
  }
});

function showError(message) {
  weatherDiv.innerHTML = `<p style="color: red;">${message}</p>`;
}

function createCardCurrent(data) {
  return `
    <div class="card">
      <h2>${data.name}</h2>
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}" />
      <p style="text-transform: capitalize;">${data.weather[0].description}</p>
      <p>Temperatura: ${data.main.temp.toFixed(1)} °C</p>
      <p>Min: ${data.main.temp_min.toFixed(1)} °C</p>
      <p>Max: ${data.main.temp_max.toFixed(1)} °C</p>
      <p>Umidade: ${data.main.humidity}%</p>
      <p>Vento: ${data.wind.speed} m/s</p>
    </div>
  `;
}

async function fetchWeatherByCity(city) {
  weatherDiv.innerHTML = '<p>Carregando...</p>';
  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Cidade não encontrada');
    const data = await res.json();
    if (!data.weather) throw new Error('Previsão não disponível');
    weatherDiv.innerHTML = createCardCurrent(data);
    document.title = `Clima - ${data.name}`;
  } catch (error) {
    showError(error.message);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  weatherDiv.innerHTML = '<p>Carregando previsão local...</p>';
  try {
    const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Não foi possível obter a previsão local');
    const data = await res.json();
    if (!data.weather) throw new Error('Previsão não disponível');
    weatherDiv.innerHTML = createCardCurrent(data);
    document.title = `Clima - ${data.name}`;
  } catch (error) {
    showError(error.message);
  }
}

function init() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      err => {
        showError('Não foi possível obter sua localização. Por favor, pesquise uma cidade.');
      }
    );
  } else {
    showError('Geolocalização não suportada. Por favor, pesquise uma cidade.');
  }
}

init();
