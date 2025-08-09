const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");

const weatherDiv = document.getElementById("weather");
const cityNameEl = document.getElementById("city-name");
const iconEl = document.getElementById("icon");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const detailsEl = document.getElementById("details");
const spinner = document.getElementById("spinner");
const errorMessageDiv = document.getElementById("error-message");
const themeToggle = document.getElementById("theme-toggle");
const loadingText = document.getElementById("loading-text"); // Novo para feedback

// Sugestões de cidades
const suggestionsList = document.getElementById("suggestions");

function formatTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toUTCString().match(/(\d{2}:\d{2}:\d{2})/)[0];
}

function setDynamicBackground(mainWeather) {
  const body = document.body;
  const theme = body.classList.contains('dark') ? 'dark' : 'light';
  const gradients = {
    light: {
      clear: 'var(--bg-gradient-light-clear)',
      clouds: 'var(--bg-gradient-light-clouds)',
      rain: 'var(--bg-gradient-light-rain)',
      drizzle: 'var(--bg-gradient-light-rain)',
      thunderstorm: 'var(--bg-gradient-light-thunderstorm)',
      snow: 'var(--bg-gradient-light-snow)',
    },
    dark: {
      clear: 'var(--bg-gradient-dark-clear)',
      clouds: 'var(--bg-gradient-dark-clouds)',
      rain: 'var(--bg-gradient-dark-rain)',
      drizzle: 'var(--bg-gradient-dark-rain)',
      thunderstorm: 'var(--bg-gradient-dark-thunderstorm)',
      snow: 'var(--bg-gradient-dark-snow)',
    }
  };
  const grad = gradients[theme][mainWeather.toLowerCase()] || gradients[theme].clear;
  body.style.background = grad;
}

function updateIcon(mainWeather) {
  iconEl.className = 'weather-icon ' + mainWeather.toLowerCase();
}

function displayWeather(data) {
  errorMessageDiv.style.display = "none";
  weatherDiv.style.display = "grid";

  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  tempEl.textContent = Math.round(data.main.temp) + "°C";
  descEl.textContent = data.weather[0].description;

  const sensacao = `Sensação térmica: ${data.main.feels_like.toFixed(1)}°`;
  const vento = `Vento: ${data.wind.speed} m/s`;
  const umidade = `Umidade: ${data.main.humidity}%`;
  const pressao = `Pressão: ${data.main.pressure} hPa`;
  const visibilidade = `Visibilidade: ${(data.visibility / 1000).toFixed(1)} km`;
  const nascersol = `Nascer do sol: ${formatTime(data.sys.sunrise, data.timezone)}`;
  const porsol = `Pôr do sol: ${formatTime(data.sys.sunset, data.timezone)}`;

  detailsEl.innerHTML = `${sensacao}<br/>${vento}<br/>${umidade}<br/>${pressao}<br/>${visibilidade}<br/>${nascersol}<br/>${porsol}`;

  updateIcon(data.weather[0].main);
  setDynamicBackground(data.weather[0].main);
}

function showError(message) {
  let userMessage = "Ops! Não encontramos essa cidade. Tente outro nome ou verifique a ortografia.";
  if (message.toLowerCase().includes("network")) {
    userMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
  }
  errorMessageDiv.textContent = userMessage;
  errorMessageDiv.style.display = "block";
  weatherDiv.style.display = "none";
}

async function fetchWeather(city) {
  searchBtn.disabled = true;
  spinner.style.display = "block";
  loadingText.style.display = "inline";
  errorMessageDiv.style.display = "none";

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();
    displayWeather(data);
    saveFavorite(data.name);
    getAirQuality(data.coord.lat, data.coord.lon);
  } catch (err) {
    showError(err.message);
  } finally {
    spinner.style.display = "none";
    loadingText.style.display = "none";
    searchBtn.disabled = false;
    cityInput.focus();
    cityInput.select();
  }
}

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city
