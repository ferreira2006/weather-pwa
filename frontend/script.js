// URL do backend
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

// Limite do histórico
const maxHistoryItems = 5;

// Elementos DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const historyList = document.getElementById('history-list');
const favoritesList = document.getElementById('favorites-list');
const weatherSection = document.getElementById('weather');
const cityNameEl = document.getElementById('city-name');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const detailsEl = document.getElementById('details');
const weatherErrorEl = document.getElementById('weather-error');
const spinner = document.getElementById('spinner');
const toast = document.getElementById('toast');
const themeToggle = document.getElementById('theme-toggle');
const confirmModal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

// Estado do app
let history = JSON.parse(localStorage.getItem('history')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentCity = '';
let theme = localStorage.getItem('theme') || 'light';

// Aplicar tema inicial
document.body.classList.toggle('dark', theme === 'dark');
document.body.classList.toggle('light', theme === 'light');
updateThemeButton();

// Renderizar histórico e favoritos
renderHistory();
renderFavorites();

// Habilitar/desabilitar botões
function updateButtons() {
  const hasCity = cityInput.value.trim().length > 0;
  searchBtn.disabled = !hasCity;
  favBtn.disabled = !hasCity;
}

cityInput.addEventListener('input', updateButtons);

// Função de toast
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Funções de histórico
function addToHistory(city) {
  history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  if(history.length > maxHistoryItems) history.pop();
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  history.forEach(city => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.textContent = city;
    li.addEventListener('click', () => searchCity(city));
    li.addEventListener('keypress', (e) => { if(e.key==='Enter') searchCity(city); });
    historyList.appendChild(li);
  });
}

// Funções de favoritos
function renderFavorites() {
  favoritesList.innerHTML = '';
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.textContent = city;
    li.addEventListener('click', () => removeFavorite(city));
    li.addEventListener('keypress', (e) => { if(e.key==='Enter') removeFavorite(city); });
    favoritesList.appendChild(li);
  });
}

function addFavorite(city) {
  if(!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    showToast(`${city} adicionada aos favoritos!`);
  } else {
    showToast(`${city} já está nos favoritos.`);
  }
}

function removeFavorite(city) {
  confirmModal.hidden = false;
  confirmYes.onclick = () => {
    favorites = favorites.filter(c => c !== city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    confirmModal.hidden = true;
    showToast(`${city} removida dos favoritos.`);
  };
  confirmNo.onclick = () => confirmModal.hidden = true;
}

// Função de loading
function setLoading(isLoading) {
  weatherSection.classList.toggle('loading', isLoading);
}

// Função de exibir clima
function renderWeather(data) {
  if(!data || data.error) {
    weatherErrorEl.textContent = data?.error || 'Cidade não encontrada';
    document.body.classList.add('error');
    return;
  }
  document.body.classList.remove('error');

  cityNameEl.textContent = data.name;
  tempEl.textContent = `${data.temp} °C`;
  descEl.textContent = data.description;
  detailsEl.textContent = `Sensação: ${data.feels_like} °C | Umidade: ${data.humidity}% | Vento: ${data.wind_speed} m/s`;

  const iconEl = document.getElementById('icon');
  iconEl.className = `weather-icon ${data.icon}`;

  // Atualizar background
  document.body.classList.remove('bg-clear','bg-clouds','bg-rain','bg-thunderstorm','bg-snow');
  document.body.classList.add(`bg-${data.icon}`);
}

// Buscar clima
async function searchCity(city) {
  if(!city) city = cityInput.value.trim();
  if(!city) return;
  currentCity = city;
  setLoading(true);

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    renderWeather(data);
    addToHistory(city);
  } catch(err) {
    renderWeather({ error: 'Erro ao buscar dados.' });
  } finally {
    setLoading(false);
  }
}

searchBtn.addEventListener('click', (e) => {
  e.preventDefault();
  searchCity();
});

cityInput.addEventListener('keypress', (e) => { if(e.key==='Enter') searchCity(); });
favBtn.addEventListener('click', () => addFavorite(currentCity));

// Tema
function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark', theme==='dark');
  document.body.classList.toggle('light', theme==='light');
  localStorage.setItem('theme', theme);
  updateThemeButton();
}

function updateThemeButton() {
  themeToggle.textContent = theme === 'light' ? 'Modo Escuro' : 'Modo Claro';
}

themeToggle.addEventListener('click', toggleTheme);

// Geolocalização
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(async pos => {
    const {latitude, longitude} = pos.coords;
    try{
      const res = await fetch(`${backendUrl}?lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      renderWeather(data);
      if(data.name) addToHistory(data.name);
    }catch(err){ console.log('Erro geolocalização:', err); }
  });
}
