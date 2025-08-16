const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const favIcon = document.getElementById('fav-icon');
const weatherCard = document.getElementById('weather');
const weatherContent = document.getElementById('weather-content');
const weatherError = document.getElementById('weather-error');
const spinner = document.getElementById('spinner');
const themeToggle = document.getElementById('theme-toggle');
const favoritesList = document.getElementById('favorites-list');
const historyList = document.getElementById('history-list');
const toast = document.getElementById('toast');
const confirmModal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];
let currentCity = "";

// ===== FUNÇÕES UTILITÁRIAS =====
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
}

function saveHistory() {
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
}

function addHistory(city) {
  history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  if (history.length > maxHistoryItems) history.pop();
  saveHistory();
}

function isFavorited(city) {
  return favorites.some(f => f.toLowerCase() === city.toLowerCase());
}

// ===== RENDER =====
function renderFavorites() {
  favoritesList.innerHTML = "";
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => loadWeather(city));
    li.addEventListener('keydown', e => { if (e.key === 'Enter') loadWeather(city); });
    favoritesList.appendChild(li);
  });
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => loadWeather(city));
    li.addEventListener('keydown', e => { if (e.key === 'Enter') loadWeather(city); });
    historyList.appendChild(li);
  });
}

function updateFavIcon() {
  if (!currentCity) return;
  if (isFavorited(currentCity)) {
    favIcon.classList.remove('not-favorited');
    favIcon.classList.add('favorited');
  } else {
    favIcon.classList.remove('favorited');
    favIcon.classList.add('not-favorited');
  }
}

// ===== TEMAS =====
function toggleTheme() {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
  const isDark = document.body.classList.contains('dark');
  themeToggle.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
  themeToggle.setAttribute('aria-pressed', isDark);
}

themeToggle.addEventListener('click', toggleTheme);

// ===== FETCH CLIMA =====
async function loadWeather(city) {
  if (!city) return;
  currentCity = city;
  searchBtn.disabled = true;
  favBtn.disabled = true;
  weatherCard.classList.add('loading');
  weatherError.style.display = 'none';
  weatherContent.style.display = 'block';

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Cidade não encontrada');
    const data = await res.json();

    // Atualiza card
    document.getElementById('city-name').textContent = data.name;
    document.getElementById('temp').textContent = `${Math.round(data.temp)} °C`;
    document.getElementById('desc').textContent = data.desc;
    document.getElementById('details').textContent = `Umidade: ${data.humidity}% | Vento: ${data.wind} m/s`;

    const icon = document.getElementById('icon');
    icon.className = `weather-icon ${data.weather}`;

    // Atualiza tema e favoritos
    document.body.className = `${document.body.classList.contains('dark') ? 'dark' : 'light'} bg-${data.weather}`;
    updateFavIcon();
    addHistory(data.name);
  } catch (err) {
    weatherError.textContent = err.message;
    weatherError.style.display = 'block';
    weatherContent.style.display = 'none';
  } finally {
    searchBtn.disabled = false;
    favBtn.disabled = false;
    weatherCard.classList.remove('loading');
  }
}

// ===== FAVORITOS =====
favBtn.addEventListener('click', () => {
  if (!currentCity) return;
  if (isFavorited(currentCity)) {
    // Modal para remover
    confirmModal.hidden = false;
    confirmYes.onclick = () => {
      favorites = favorites.filter(f => f.toLowerCase() !== currentCity.toLowerCase());
      saveFavorites();
      updateFavIcon();
      confirmModal.hidden = true;
      showToast(`${currentCity} removida dos favoritos`);
    };
    confirmNo.onclick = () => { confirmModal.hidden = true; };
  } else {
    favorites.push(currentCity);
    saveFavorites();
    updateFavIcon();
    showToast(`${currentCity} adicionada aos favoritos`);
  }
});

// ===== INPUT =====
cityInput.addEventListener('input', () => {
  searchBtn.disabled = !cityInput.value.trim();
  favBtn.disabled = !cityInput.value.trim();
});

document.getElementById('search-box').addEventListener('submit', e => {
  e.preventDefault();
  loadWeather(cityInput.value.trim());
});

// ===== TECLAS DE ATALHO =====
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if (document.activeElement === cityInput) loadWeather(cityInput.value.trim());
  }
  if (e.altKey && e.key.toLowerCase() === 't') toggleTheme();
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    cityInput.focus();
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'd' && currentCity) {
    favBtn.click();
  }
});

// ===== INIT =====
renderFavorites();
renderHistory();
