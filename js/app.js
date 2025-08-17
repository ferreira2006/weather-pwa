// ==================== CONFIGURAÇÃO ====================
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ==================== UTILITÁRIOS ====================
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  },
  showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  },
  saveLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  getLocal(key) { return JSON.parse(localStorage.getItem(key)) || []; }
};

// ==================== ELEMENTOS ====================
const body = document.body;
const searchInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const favIcon = document.getElementById('fav-icon');
const favoritesList = document.getElementById('favorites-list');
const historyList = document.getElementById('history-list');
const weatherSection = document.getElementById('weather');
const weatherContent = document.getElementById('weather-content');
const weatherError = document.getElementById('weather-error');
const spinner = document.getElementById('spinner');
const themeToggle = document.getElementById('theme-toggle');
const confirmModal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');
const cityNameEl = document.getElementById('city-name');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const detailsEl = document.getElementById('details');
const iconEl = document.getElementById('icon');

// ==================== ESTADOS ====================
let favorites = Utils.getLocal('favorites');
let history = Utils.getLocal('history');
let currentCity = null;
let pendingRemoval = null;

// ==================== TEMA ====================
function applyTheme(theme) {
  body.classList.remove('light', 'dark');
  body.classList.add(theme);
  themeToggle.textContent = theme === 'light' ? 'Modo Escuro' : 'Modo Claro';
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
}
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

// ==================== FAVORITOS ====================
function renderFavorites() {
  favoritesList.innerHTML = '';
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => searchCity(city));
    li.addEventListener('keydown', e => { if (e.key === 'Enter') searchCity(city); });
    favoritesList.appendChild(li);
  });
  updateFavBtn();
}

function updateFavBtn() {
  if (!currentCity) return;
  const isFav = favorites.includes(currentCity);
  favIcon.className = isFav ? 'favorited' : 'not-favorited';
  favBtn.disabled = false;
  favBtn.textContent = isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  favBtn.prepend(favIcon);
}

// ==================== HISTÓRICO ====================
function renderHistory() {
  historyList.innerHTML = '';
  history.slice().reverse().forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => searchCity(city));
    li.addEventListener('keydown', e => { if (e.key === 'Enter') searchCity(city); });
    historyList.appendChild(li);
  });
}

function addToHistory(city) {
  history = history.filter(c => c !== city);
  history.push(city);
  if (history.length > maxHistoryItems) history.shift();
  Utils.saveLocal('history', history);
  renderHistory();
}

// ==================== BUSCA ====================
async function fetchWeather(city) {
  try {
    weatherSection.classList.add('loading');
    weatherError.style.display = 'none';
    weatherContent.style.display = 'block';
    iconEl.style.display = 'block';

    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Cidade não encontrada');
    const data = await res.json();

    displayWeather(data);
    addToHistory(city);
  } catch (err) {
    showError(err.message);
  } finally {
    weatherSection.classList.remove('loading');
  }
}

function displayWeather(data) {
  currentCity = Utils.capitalizeCityName(data.name);
  cityNameEl.textContent = currentCity;
  tempEl.textContent = `${Math.round(data.temp)} °C`;
  descEl.textContent = data.description;
  detailsEl.textContent = `Umidade: ${data.humidity}% | Vento: ${data.wind} m/s`;
  iconEl.className = `weather-icon ${data.icon}`;
  updateFavBtn();
}

function showError(message) {
  weatherError.textContent = message;
  weatherError.style.display = 'block';
  weatherContent.style.display = 'none';
  iconEl.style.display = 'none';
  body.classList.add('error');
}

// ==================== EVENTOS ====================
searchBtn.addEventListener('click', e => {
  e.preventDefault();
  if (!searchInput.value.trim()) return;
  searchCity(searchInput.value.trim());
});

function searchCity(city) {
  fetchWeather(city);
}

favBtn.addEventListener('click', () => {
  if (!currentCity) return;
  if (favorites.includes(currentCity)) {
    pendingRemoval = currentCity;
    confirmModal.hidden = false;
    confirmModal.querySelector('.modal-content').focus();
  } else {
    favorites.push(currentCity);
    Utils.saveLocal('favorites', favorites);
    renderFavorites();
    Utils.showToast('Cidade adicionada aos favoritos!');
  }
});

// ==================== MODAL ====================
confirmYes.addEventListener('click', () => {
  favorites = favorites.filter(c => c !== pendingRemoval);
  Utils.saveLocal('favorites', favorites);
  renderFavorites();
  confirmModal.hidden = true;
  pendingRemoval = null;
  Utils.showToast('Cidade removida dos favoritos!');
});
confirmNo.addEventListener('click', () => {
  confirmModal.hidden = true;
  pendingRemoval = null;
});

// ==================== TEMA TOGGLE ====================
themeToggle.addEventListener('click', () => {
  const newTheme = body.classList.contains('light') ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
});

// ==================== ATALHOS DE TECLADO ====================
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.ctrlKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    themeToggle.click();
  }
});

// ==================== INICIALIZAÇÃO ====================
renderFavorites();
renderHistory();
