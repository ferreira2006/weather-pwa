const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ===== UTILS =====
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  },
  showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.opacity = 1;
    setTimeout(() => { toast.style.opacity = 0; }, duration);
  },
  saveToLocal(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  loadFromLocal(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
};

// ===== APP STATE =====
let state = {
  theme: 'light',
  currentCity: null,
  favorites: Utils.loadFromLocal('favorites') || [],
  history: Utils.loadFromLocal('history') || [],
};

// ===== DOM ELEMENTS =====
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const favIcon = document.getElementById('fav-icon');
const weatherSection = document.getElementById('weather');
const weatherContent = document.getElementById('weather-content');
const weatherError = document.getElementById('weather-error');
const historyList = document.getElementById('history-list');
const favoritesList = document.getElementById('favorites-list');
const themeToggle = document.getElementById('theme-toggle');
const toast = document.getElementById('toast');
const confirmModal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

// ===== THEME =====
function applyTheme(theme) {
  document.body.classList.remove('light','dark');
  document.body.classList.add(theme);
  state.theme = theme;
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
  themeToggle.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
}
themeToggle.addEventListener('click', () => {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
});
applyTheme(state.theme);

// ===== FAVORITES =====
function updateFavButton() {
  if (!state.currentCity) return;
  if (state.favorites.includes(state.currentCity)) {
    favIcon.classList.add('favorited');
    favIcon.classList.remove('not-favorited');
    favBtn.textContent = ' Remover dos favoritos';
  } else {
    favIcon.classList.remove('favorited');
    favIcon.classList.add('not-favorited');
    favBtn.textContent = ' Adicionar aos favoritos';
  }
}

function toggleFavorite() {
  if (!state.currentCity) return;
  if (state.favorites.includes(state.currentCity)) {
    // Show confirmation modal
    confirmModal.showModal?.() || (confirmModal.hidden = false);
  } else {
    state.favorites.push(state.currentCity);
    Utils.saveToLocal('favorites', state.favorites);
    Utils.showToast(`${state.currentCity} adicionada aos favoritos`);
    renderFavorites();
    updateFavButton();
  }
}

favBtn.addEventListener('click', toggleFavorite);
confirmYes.addEventListener('click', () => {
  state.favorites = state.favorites.filter(c => c !== state.currentCity);
  Utils.saveToLocal('favorites', state.favorites);
  renderFavorites();
  updateFavButton();
  confirmModal.hidden = true;
});
confirmNo.addEventListener('click', () => { confirmModal.hidden = true; });

// ===== FAVORITES RENDER =====
function renderFavorites() {
  favoritesList.innerHTML = '';
  state.favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => fetchWeather(city));
    favoritesList.appendChild(li);
  });
}
renderFavorites();

// ===== HISTORY =====
function addToHistory(city) {
  city = Utils.capitalizeCityName(city);
  state.history = [city, ...state.history.filter(c => c !== city)].slice(0,maxHistoryItems);
  Utils.saveToLocal('history', state.history);
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  state.history.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => fetchWeather(city));
    historyList.appendChild(li);
  });
}
renderHistory();

// ===== WEATHER FETCH =====
async function fetchWeather(city) {
  city = Utils.capitalizeCityName(city);
  state.currentCity = city;
  cityInput.value = city;
  searchBtn.disabled = true;
  favBtn.disabled = true;
  weatherSection.classList.add('loading');
  weatherError.style.display = 'none';
  weatherContent.style.display = 'block';

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Cidade não encontrada');
    const data = await res.json();
    renderWeather(data);
    addToHistory(city);
    updateFavButton();
  } catch(err) {
    weatherError.textContent = err.message;
    weatherError.style.display = 'block';
    weatherContent.style.display = 'none';
  } finally {
    weatherSection.classList.remove('loading');
    searchBtn.disabled = false;
    favBtn.disabled = false;
  }
}

function renderWeather(data) {
  document.getElementById('city-name').textContent = data.name;
  document.getElementById('temp').textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById('desc').textContent = data.weather[0].description;
  document.getElementById('details').textContent = `Umidade: ${data.main.humidity}% | Vento: ${data.wind.speed} m/s`;
  
  const iconDiv = document.getElementById('icon');
  iconDiv.className = `weather-icon ${mapWeatherToClass(data.weather[0].main)}`;

  // Atualiza background
  document.body.classList.remove('bg-clear','bg-clouds','bg-rain','bg-thunderstorm','bg-snow');
  document.body.classList.add(`bg-${mapWeatherToClass(data.weather[0].main)}`);
}

function mapWeatherToClass(main) {
  switch(main.toLowerCase()) {
    case 'clear': return 'clear';
    case 'clouds': return 'clouds';
    case 'rain': case 'drizzle': return 'rain';
    case 'thunderstorm': return 'thunderstorm';
    case 'snow': return 'snow';
    default: return 'clear';
  }
}

// ===== SEARCH =====
cityInput.addEventListener('input', () => { searchBtn.disabled = !cityInput.value.trim(); favBtn.disabled = !cityInput.value.trim(); });
document.getElementById('search-box').addEventListener('submit', e => { e.preventDefault(); fetchWeather(cityInput.value); });

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
  if(e.target.tagName === 'INPUT') return; // não interferir na digitação
  if(e.key === 'Enter') fetchWeather(cityInput.value);
  else if(e.key.toLowerCase() === 'f') toggleFavorite();
  else if(e.key.toLowerCase() === 't') applyTheme(state.theme === 'light' ? 'dark' : 'light');
});

// ===== INITIAL LOAD =====
if(state.history[0]) fetchWeather(state.history[0]);
