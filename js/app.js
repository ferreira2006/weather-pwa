// ===================== CONFIGURAÇÕES =====================
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ===================== UTILITÁRIOS =====================
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  },
  debounce(fn, delay = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }
};

// ===================== ELEMENTOS =====================
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const favIcon = document.getElementById('fav-icon');
const weatherCard = document.getElementById('weather');
const cityNameEl = document.getElementById('city-name');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const detailsEl = document.getElementById('details');
const iconEl = document.getElementById('icon');
const spinnerEl = document.getElementById('spinner');
const historyList = document.getElementById('history-list');
const favoritesList = document.getElementById('favorites-list');
const toastEl = document.getElementById('toast');
const bodyEl = document.body;

// ===================== STATE =====================
let currentCity = '';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];

// ===================== FUNÇÕES =====================
function setLoading(isLoading) {
  if (isLoading) {
    weatherCard.classList.add('loading');
  } else {
    weatherCard.classList.remove('loading');
  }
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2500);
}

function toggleSearchBtn() {
  searchBtn.disabled = !cityInput.value.trim();
}

function saveHistory(city) {
  history = history.filter(c => c !== city);
  history.unshift(city);
  if (history.length > maxHistoryItems) history.pop();
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  history.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => searchCity(city));
    historyList.appendChild(li);
  });
}

function toggleFavorite(city) {
  if (favorites.includes(city)) {
    favorites = favorites.filter(c => c !== city);
    showToast('Cidade removida dos favoritos!');
  } else {
    favorites.push(city);
    showToast('Cidade adicionada aos favoritos!');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
  updateFavIcon(city);
}

function renderFavorites() {
  favoritesList.innerHTML = '';
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => searchCity(city));
    favoritesList.appendChild(li);
  });
}

function updateFavIcon(city) {
  if (favorites.includes(city)) {
    favIcon.classList.add('favorited');
    favIcon.classList.remove('not-favorited');
    favBtn.setAttribute('aria-pressed', 'true');
  } else {
    favIcon.classList.remove('favorited');
    favIcon.classList.add('not-favorited');
    favBtn.setAttribute('aria-pressed', 'false');
  }
}

function clearWeather() {
  cityNameEl.textContent = '--';
  tempEl.textContent = '-- °C';
  descEl.textContent = 'Aguardando dados...';
  detailsEl.textContent = '--';
  iconEl.className = 'weather-icon';
}

async function searchCity(city) {
  currentCity = Utils.capitalizeCityName(city);
  setLoading(true);
  clearWeather();

  try {
    const response = await fetch(`${backendUrl}?city=${encodeURIComponent(currentCity)}`);
    if (!response.ok) throw new Error('Cidade não encontrada');
    const data = await response.json();

    cityNameEl.textContent = currentCity;
    tempEl.textContent = `${Math.round(data.temp)} °C`;
    descEl.textContent = data.description;
    detailsEl.textContent = `Umidade: ${data.humidity}% | Vento: ${data.wind_speed} km/h`;

    const weatherType = data.type.toLowerCase();
    iconEl.className = `weather-icon ${weatherType}`;
    bodyEl.className = `${bodyEl.classList.contains('dark') ? 'dark' : 'light'} bg-${weatherType}`;

    saveHistory(currentCity);
    updateFavIcon(currentCity);
  } catch (err) {
    showToast(err.message);
  } finally {
    setLoading(false);
  }
}

// ===================== EVENTOS =====================
cityInput.addEventListener('input', Utils.debounce(toggleSearchBtn, 300));
searchBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (cityInput.value.trim()) searchCity(cityInput.value.trim());
});

favBtn.addEventListener('click', () => {
  if (currentCity) toggleFavorite(currentCity);
});

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const isDark = bodyEl.classList.toggle('dark');
  bodyEl.classList.toggle('light', !isDark);
  themeToggle.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
});

function init() {
  renderHistory();
  renderFavorites();
  toggleSearchBtn();
  if (favorites.length) updateFavIcon(favorites[0]);
}

init();
