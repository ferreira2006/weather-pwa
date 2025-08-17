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
const searchBox = document.getElementById('search-box');
const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const favIcon = document.getElementById('fav-icon');
const weatherCard = document.getElementById('weather');
const weatherContent = document.getElementById('weather-content');
const weatherError = document.getElementById('weather-error');
const cityNameEl = document.getElementById('city-name');
const tempEl = document.querySelector('.temp');
const descEl = document.querySelector('.desc');
const detailsEl = document.querySelector('.details');
const weatherIconEl = document.querySelector('.weather-icon');
const spinner = document.getElementById('spinner');
const themeToggle = document.getElementById('theme-toggle');

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];
let selectedCity = null;

// ===== INJETAR SELECTS =====
const stateSelect = document.createElement('select');
stateSelect.id = 'state-select';
stateSelect.innerHTML = `<option value="">Selecione o estado</option>
<option value="SP">São Paulo</option>
<option value="RJ">Rio de Janeiro</option>
<option value="MG">Minas Gerais</option>
<option value="RS">Rio Grande do Sul</option>`;
stateSelect.addEventListener('change', updateCityOptions);

const citySelect = document.createElement('select');
citySelect.id = 'city-select';
citySelect.innerHTML = `<option value="">Selecione a cidade</option>`;
citySelect.addEventListener('change', () => {
  selectedCity = citySelect.value;
  searchBtn.disabled = !selectedCity;
  favBtn.disabled = !selectedCity;
});

searchBox.insertBefore(stateSelect, searchBtn);
searchBox.insertBefore(citySelect, searchBtn);

// ===== FUNÇÕES DE SELECT =====
function updateCityOptions() {
  const state = stateSelect.value;
  let cities = [];
  if(state === "SP") cities = ["São Paulo","Campinas","Santos"];
  else if(state === "RJ") cities = ["Rio de Janeiro","Niterói","Búzios"];
  else if(state === "MG") cities = ["Belo Horizonte","Uberlândia","Ouro Preto"];
  else if(state === "RS") cities = ["Porto Alegre","Gramado","Caxias do Sul"];
  citySelect.innerHTML = `<option value="">Selecione a cidade</option>` + 
    cities.map(c => `<option value="${c}">${c}</option>`).join('');
  selectedCity = null;
  searchBtn.disabled = true;
  favBtn.disabled = true;
}

// ===== FETCH CLIMA =====
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

// ===== EXIBIÇÃO =====
function showWeather(data) {
  document.body.classList.remove('error');
  weatherContent.style.display = 'block';
  weatherError.style.display = 'none';

  cityNameEl.textContent = Utils.capitalizeCityName(data.name);
  tempEl.textContent = data.temp.toFixed(1);
  descEl.textContent = data.description;
  detailsEl.innerHTML = `Umidade: ${data.humidity}%<br>Vento: ${data.wind} m/s`;

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

// ===== HISTÓRICO =====
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

// ===== FAVORITOS =====
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

// ===== BACKGROUND =====
function applyBackground(icon) {
  document.body.classList.remove('bg-clear','bg-clouds','bg-rain','bg-thunderstorm','bg-snow');
  document.body.classList.add(`bg-${icon}`);
}

// ===== TEMA =====
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? "Modo Claro" : "Modo Escuro";
});

// ===== EVENTOS =====
searchBtn.addEventListener('click', () => fetchWeather(selectedCity));
favBtn.addEventListener('click', toggleFavorite);

// ===== INICIALIZAÇÃO =====
renderHistory();
renderFavorites();
