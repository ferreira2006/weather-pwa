// =======================
// CONFIGURAÇÕES
// =======================
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// =======================
// ELEMENTOS DO DOM
// =======================
const stateSelect = document.createElement('select');
stateSelect.id = 'state-select';
stateSelect.setAttribute('aria-label', 'Selecione o estado');

const citySelect = document.createElement('select');
citySelect.id = 'city-select';
citySelect.setAttribute('aria-label', 'Selecione o município');

const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const favIcon = document.getElementById('fav-icon');

const weatherCard = document.getElementById('weather');
const iconEl = document.getElementById('icon');
const cityNameEl = document.getElementById('city-name');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const detailsEl = document.getElementById('details');
const errorEl = document.getElementById('weather-error');
const spinner = document.getElementById('spinner');

const historyList = document.getElementById('history-list');
const favoritesList = document.getElementById('favorites-list');
const toastEl = document.getElementById('toast');
const themeToggle = document.getElementById('theme-toggle');

const confirmModal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

// =======================
// ESTADOS & MUNICÍPIOS
// =======================
async function fetchStates() {
  try {
    const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
    const states = await res.json();
    stateSelect.innerHTML = '<option value="">Selecione o estado</option>';
    states.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state.sigla;
      opt.textContent = state.nome;
      stateSelect.appendChild(opt);
    });
    searchBtn.disabled = true;
  } catch (err) {
    showToast('Erro ao carregar estados');
  }
}

async function fetchCities(stateSigla) {
  citySelect.innerHTML = '<option value="">Selecione o município</option>';
  if (!stateSigla) return;
  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateSigla}/municipios`);
    const cities = await res.json();
    cities.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city.nome;
      opt.textContent = city.nome;
      citySelect.appendChild(opt);
    });
  } catch (err) {
    showToast('Erro ao carregar municípios');
  }
}

// =======================
// TOAST
// =======================
function showToast(msg, duration = 3000) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

// =======================
// HISTÓRICO
// =======================
function addToHistory(city) {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  history = history.filter(c => c !== city);
  history.unshift(city);
  if (history.length > maxHistoryItems) history.pop();
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('history')) || [];
  historyList.innerHTML = '';
  history.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => searchWeatherByCity(city));
    li.addEventListener('keypress', e => { if(e.key==='Enter') searchWeatherByCity(city); });
    historyList.appendChild(li);
  });
}

// =======================
// FAVORITOS
// =======================
function renderFavorites() {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  favoritesList.innerHTML = '';
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => searchWeatherByCity(city));
    li.addEventListener('keypress', e => { if(e.key==='Enter') searchWeatherByCity(city); });
    li.addEventListener('contextmenu', e => {
      e.preventDefault();
      showConfirmModal(city);
    });
    favoritesList.appendChild(li);
  });
}

function toggleFavorite(city) {
  if(!city) return;
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favorites.includes(city)) {
    favorites = favorites.filter(c => c !== city);
    favIcon.classList.remove('favorited');
    favIcon.classList.add('not-favorited');
  } else {
    favorites.push(city);
    favIcon.classList.add('favorited');
    favIcon.classList.remove('not-favorited');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
}

function showConfirmModal(city) {
  confirmModal.hidden = false;
  confirmYes.onclick = () => {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(c => c !== city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    confirmModal.hidden = true;
    showToast(`${city} removido dos favoritos`);
  };
  confirmNo.onclick = () => { confirmModal.hidden = true; };
}

// =======================
// TEMA
// =======================
function toggleTheme() {
  const body = document.body;
  if (body.classList.contains('light')) {
    body.classList.replace('light','dark');
    themeToggle.textContent = 'Modo Claro';
    themeToggle.setAttribute('aria-pressed', 'true');
  } else {
    body.classList.replace('dark','light');
    themeToggle.textContent = 'Modo Escuro';
    themeToggle.setAttribute('aria-pressed', 'false');
  }
}

// =======================
// BUSCA DE CLIMA
// =======================
async function searchWeather() {
  const state = stateSelect.value;
  const city = citySelect.value;
  if (!state || !city) return;

  weatherCard.classList.add('loading');
  errorEl.style.display = 'none';
  errorEl.textContent = '';

  try {
    const res = await fetch(`${backendUrl}?state=${state}&city=${city}`);
    const data = await res.json();

    cityNameEl.textContent = `${data.name}, ${data.state}`;
    tempEl.textContent = `${data.temp} °C`;
    descEl.textContent = data.desc;
    detailsEl.textContent = `Umidade: ${data.humidity}% | Vento: ${data.wind.speed} km/h`;

    iconEl.className = `weather-icon ${data.icon || 'clear'}`;

    addToHistory(city);
    checkFavorite(city);
  } catch (err) {
    errorEl.textContent = 'Erro ao carregar o clima.';
    errorEl.style.display = 'block';
  } finally {
    weatherCard.classList.remove('loading');
  }
}

function searchWeatherByCity(city) {
  const history = JSON.parse(localStorage.getItem('history')) || [];
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  let state = '';
  // Tenta descobrir estado pelo histórico/favoritos ou default
  // Nesse exemplo mantemos o último estado selecionado
  state = stateSelect.value || '';
  citySelect.value = city;
  searchBtn.disabled = false;
  searchWeather();
}

function checkFavorite(city) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favorites.includes(city)) {
    favIcon.classList.add('favorited');
    favIcon.classList.remove('not-favorited');
  } else {
    favIcon.classList.remove('favorited');
    favIcon.classList.add('not-favorited');
  }
}

// =======================
// INICIALIZAÇÃO
// =======================
function init() {
  const searchBox = document.getElementById('search-box');
  searchBox.prepend(stateSelect);
  searchBox.insertBefore(citySelect, searchBtn);

  fetchStates();
  renderHistory();
  renderFavorites();

  stateSelect.addEventListener('change', () => {
    fetchCities(stateSelect.value);
    searchBtn.disabled = true;
    citySelect.value = '';
  });

  citySelect.addEventListener('change', () => {
    searchBtn.disabled = !citySelect.value;
  });

  searchBtn.addEventListener('click', e => {
    e.preventDefault();
    searchWeather();
  });

  favBtn.addEventListener('click', () => toggleFavorite(citySelect.value));

  themeToggle.addEventListener('click', toggleTheme);
}

init();
