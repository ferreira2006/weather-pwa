// ===== CONFIGURAÇÕES =====
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ===== TEMAS =====
const Themes = {
  light: { text: '#000', inputText: '#000', inputBg: 'rgba(255,255,255,0.9)', loadingBg: 'rgba(255,255,255,0.35)' },
  dark: { text: '#ddd', inputText: '#cfd8dc', inputBg: 'rgba(255,255,255,0.1)', loadingBg: 'rgba(255,255,255,0.15)' },
};

function toggleTheme() {
  const body = document.body;
  body.classList.toggle('dark');
  body.classList.toggle('light');
  updateThemeStyles();
}

function updateThemeStyles() {
  const theme = document.body.classList.contains('dark') ? Themes.dark : Themes.light;
  document.documentElement.style.setProperty('--text-color-light', theme.text);
  document.documentElement.style.setProperty('--input-text-light', theme.inputText);
  document.documentElement.style.setProperty('--input-bg-light', theme.inputBg);
  document.documentElement.style.setProperty('--loading-bg-light', theme.loadingBg);
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
updateThemeStyles();

// ===== TOAST =====
function showToast(message, duration=3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== HISTÓRICO E FAVORITOS =====
function addToHistory(city) {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  history = [city, ...history.filter(c => c !== city)].slice(0, maxHistoryItems);
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const historyList = document.getElementById('history-list');
  const history = JSON.parse(localStorage.getItem('history')) || [];
  historyList.innerHTML = '';
  history.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => fetchWeather(city));
    historyList.appendChild(li);
  });
}

function toggleFavorite(city) {
  let favs = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favs.includes(city)) {
    favs = favs.filter(c => c !== city);
  } else {
    favs.push(city);
  }
  localStorage.setItem('favorites', JSON.stringify(favs));
  renderFavorites();
}

function renderFavorites() {
  const favList = document.getElementById('favorites-list');
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  favList.innerHTML = '';
  favs.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => fetchWeather(city));
    favList.appendChild(li);
  });
}

// ===== FETCH WEATHER =====
async function fetchWeather(city) {
  const weather = document.getElementById('weather');
  weather.classList.add('loading');
  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Cidade não encontrada');
    const data = await res.json();
    renderWeather(data);
    addToHistory(city);
  } catch (err) {
    showToast(err.message);
  } finally {
    weather.classList.remove('loading');
  }
}

function renderWeather(data) {
  document.getElementById('city-name').textContent = data.city;
  document.getElementById('temp').textContent = `${Math.round(data.temp)}°C`;
  document.getElementById('desc').textContent = data.description;
  document.getElementById('details').textContent = `Sensação: ${Math.round(data.feels_like)}°C | Umidade: ${data.humidity}% | Vento: ${data.wind_speed} m/s`;
  const icon = document.getElementById('icon');
  icon.className = `weather-icon ${data.icon}`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderHistory();
  renderFavorites();
  document.getElementById('search-btn').addEventListener('click', () => {
    const city = document.getElementById('city-input').value.trim();
    if (city) fetchWeather(city);
  });
});
