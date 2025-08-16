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
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
};

// ===== ELEMENTOS =====
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const favIcon = document.getElementById('fav-icon');
const weatherSection = document.getElementById('weather');
const weatherContent = document.getElementById('weather-content');
const weatherError = document.getElementById('weather-error');
const iconEl = document.getElementById('icon');
const historyList = document.getElementById('history-list');
const favoritesList = document.getElementById('favorites-list');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const confirmModal = document.getElementById('confirm-modal');
let cityToRemove = null;

// ===== LOCALSTORAGE =====
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];
let currentCity = "";

// ===== FUNÇÕES =====
function updateFavoritesUI() {
  favoritesList.innerHTML = "";
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => searchCity(city));
    favoritesList.appendChild(li);
  });
  favIcon.className = favorites.includes(currentCity) ? 'favorited' : 'not-favorited';
}

function updateHistory(city) {
  history = [city, ...history.filter(c => c !== city)].slice(0, maxHistoryItems);
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => searchCity(city));
    historyList.appendChild(li);
  });
}

async function searchCity(city) {
  city = Utils.capitalizeCityName(city);
  if(!city) return;
  currentCity = city;
  searchBtn.disabled = true;
  favBtn.disabled = true;
  weatherSection.classList.add('loading');
  weatherError.textContent = "";
  weatherError.style.display = "none";
  iconEl.className = "weather-icon clear";

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if(!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();
    displayWeather(data);
    updateHistory(city);
  } catch(err) {
    weatherSection.classList.remove('loading');
    weatherError.style.display = "block";
    weatherError.textContent = err.message;
    weatherContent.style.display = "none";
    iconEl.style.display = "none";
  } finally {
    searchBtn.disabled = false;
    favBtn.disabled = false;
  }
}

function displayWeather(data) {
  weatherSection.classList.remove('loading');
  weatherContent.style.display = "block";
  iconEl.style.display = "block";

  document.getElementById('city-name').textContent = data.city;
  document.getElementById('temp').textContent = `${data.temp} °C`;
  document.getElementById('desc').textContent = data.desc;
  document.getElementById('details').textContent = `Umidade: ${data.humidity}% | Vento: ${data.wind} km/h`;

  iconEl.className = `weather-icon ${data.icon}`;

  favIcon.className = favorites.includes(data.city) ? 'favorited' : 'not-favorited';
}

function toggleFavorite() {
  if(!currentCity) return;
  if(favorites.includes(currentCity)) {
    cityToRemove = currentCity;
    confirmModal.hidden = false;
    confirmModal.querySelector('#confirm-yes').focus();
  } else {
    favorites.push(currentCity);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesUI();
    Utils.showToast(`${currentCity} adicionado aos favoritos!`);
  }
}

function removeFavorite(city) {
  favorites = favorites.filter(c => c !== city);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoritesUI();
  Utils.showToast(`${city} removido dos favoritos.`);
}

// ===== EVENTOS =====
searchBtn.addEventListener('click', e => {
  e.preventDefault();
  searchCity(cityInput.value);
});

favBtn.addEventListener('click', toggleFavorite);

themeToggle.addEventListener('click', () => {
  if(body.classList.contains('light')) {
    body.classList.replace('light','dark');
    themeToggle.textContent = "Modo Claro";
  } else {
    body.classList.replace('dark','light');
    themeToggle.textContent = "Modo Escuro";
  }
});

confirmModal.querySelector('#confirm-yes').addEventListener('click', () => {
  removeFavorite(cityToRemove);
  confirmModal.hidden = true;
  cityToRemove = null;
});

confirmModal.querySelector('#confirm-no').addEventListener('click', () => {
  confirmModal.hidden = true;
  cityToRemove = null;
});

// ===== ATALHOS DE TECLADO =====
document.addEventListener('keydown', e => {
  if(e.target.tagName === 'INPUT') return;
  switch(e.key.toLowerCase()) {
    case 't': themeToggle.click(); break;
    case 'f': toggleFavorite(); break;
    case 'enter': if(document.activeElement.tagName !== 'BUTTON') searchBtn.click(); break;
  }
});

// ===== INICIALIZAÇÃO =====
renderHistory();
updateFavoritesUI();
