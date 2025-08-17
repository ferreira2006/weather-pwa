const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ===== UTILITÁRIOS =====
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  },
  showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  },
};

// ===== ELEMENTOS =====
const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const favIcon = document.getElementById('fav-icon');
const cityInput = document.getElementById('city-input');
const weatherCard = document.getElementById('weather');
const weatherContent = document.getElementById('weather-content');
const weatherError = document.getElementById('weather-error');
const cityNameEl = document.getElementById('city-name');
const tempEl = document.querySelector('.temp');
const descEl = document.querySelector('.desc');
const detailsEl = document.querySelector('.details');
const weatherIconEl = document.querySelector('.weather-icon');
const spinner = document.getElementById('spinner');

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];

// ===== FUNÇÕES =====
async function fetchWeather(city) {
  if (!city) return;
  showLoading(true);
  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Cidade não encontrada');
    const data = await res.json();
    showWeather(data);
    addToHistory(data.name);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

function showWeather(data) {
  document.body.classList.remove('error');
  weatherContent.style.display = 'block';
  weatherError.style.display = 'none';

  cityNameEl.textContent = Utils.capitalizeCityName(data.name);
  tempEl.textContent = data.temp.toFixed(1); // 1 casa decimal
  descEl.textContent = data.description;
  detailsEl.innerHTML = `
    Umidade: ${data.humidity}%<br>
    Vento: ${data.wind} m/s
  `;
  
  weatherIconEl.className = `weather-icon ${data.icon}`;
  updateFavoriteIcon(data.name);
  applyBackground(data.icon);
}

function showError(msg) {
  document.body.classList.add('error');
  weatherError.textContent = msg;
}

function showLoading(state) {
  if (state) weatherCard.classList.add('loading');
  else weatherCard.classList.remove('loading');
}

function addToHistory(city) {
  city = Utils.capitalizeCityName(city);
  history = history.filter(c => c !== city);
  history.unshift(city);
  if (history.length > maxHistoryItems) history.pop();
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  history.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => fetchWeather(city));
    list.appendChild(li);
  });
}

function updateFavoriteIcon(city) {
  city = Utils.capitalizeCityName(city);
  if (favorites.includes(city)) {
    favIcon.classList.add('favorited');
    favIcon.classList.remove('not-favorited');
  } else {
    favIcon.classList.add('not-favorited');
    favIcon.classList.remove('favorited');
  }
}

function toggleFavorite() {
  const city = Utils.capitalizeCityName(cityNameEl.textContent);
  if (!city) return;
  if (favorites.includes(city)) {
    favorites = favorites.filter(c => c !== city);
    Utils.showToast(`${city} removida dos favoritos`);
  } else {
    favorites.push(city);
    Utils.showToast(`${city} adicionada aos favoritos`);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoriteIcon(city);
  renderFavorites();
}

function renderFavorites() {
  const list = document.getElementById('favorites-list');
  list.innerHTML = '';
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => fetchWeather(city));
    list.appendChild(li);
  });
}

function applyBackground(icon) {
  document.body.classList.remove('bg-clear','bg-clouds','bg-rain','bg-thunderstorm','bg-snow');
  document.body.classList.add(`bg-${icon}`);
}

// ===== EVENTOS =====
searchBtn.addEventListener('click', () => fetchWeather(cityInput.value));
favBtn.addEventListener('click', toggleFavorite);
cityInput.addEventListener('keyup', e => { if (e.key === 'Enter') fetchWeather(cityInput.value); });

// ===== INICIALIZAÇÃO =====
renderHistory();
renderFavorites();
