const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ===== UTILITIES =====
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  }
};

// ===== ELEMENTS =====
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const favBtn = document.getElementById('fav-btn');
const favoritesList = document.getElementById('favorites-list');
const historyList = document.getElementById('history-list');
const weatherSection = document.getElementById('weather');
const toast = document.getElementById('toast');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// ===== EVENTOS =====
cityInput.addEventListener('input', () => { searchBtn.disabled = !cityInput.value.trim(); });
searchBtn.addEventListener('click', searchWeather);
favBtn.addEventListener('click', toggleFavorite);
themeToggle.addEventListener('click', toggleTheme);
document.addEventListener('keydown', handleShortcuts);

// ===== FUNÇÕES =====
function searchWeather(e) {
  e.preventDefault();
  const city = Utils.capitalizeCityName(cityInput.value.trim());
  if (!city) return;

  searchBtn.classList.add('loading');
  fetch(`${backendUrl}?city=${encodeURIComponent(city)}`)
    .then(res => res.json())
    .then(data => {
      updateWeatherCard(data);
      addToHistory(city);
      searchBtn.classList.remove('loading');
    })
    .catch(err => {
      showToast("Erro ao buscar o clima!");
      searchBtn.classList.remove('loading');
    });
}

function toggleFavorite() {
  // implementação de favoritos, com modal de confirmação
}

function toggleTheme() {
  body.classList.toggle('dark');
  body.classList.toggle('light');
  updateWeatherIconTheme(body.classList.contains('dark') ? 'dark' : 'light');
}

function handleShortcuts(e) {
  if (e.altKey) {
    switch (e.key.toLowerCase()) {
      case 'c': cityInput.focus(); e.preventDefault(); break;
      case 'b': if(!searchBtn.disabled) searchBtn.click(); e.preventDefault(); break;
      case 't': themeToggle.click(); e.preventDefault(); break;
    }
  }
}

function updateWeatherCard(data) {
  if(!data) return;
  const icon = document.getElementById('icon');
  const cityName = document.getElementById('city-name');
  const temp = document.getElementById('temp');
  const desc = document.getElementById('desc');
  const details = document.getElementById('details');

  icon.className = `weather-icon ${data.weather}`;
  cityName.textContent = data.city;
  temp.textContent = `${data.temp} °C`;
  desc.textContent = data.description;
  details.textContent = `Sensação: ${data.feels_like} °C | Umidade: ${data.humidity}% | Vento: ${data.wind_speed} m/s`;

  weatherSection.classList.remove('loading');
  updateWeatherIconTheme(body.classList.contains('dark') ? 'dark' : 'light');
}

function addToHistory(city) {
  let history = JSON.parse(localStorage.getItem('history') || '[]');
  history = [city, ...history.filter(c => c !== city)].slice(0, maxHistoryItems);
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory(history);
}

function renderHistory(history) {
  historyList.innerHTML = '';
  history.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', () => { cityInput.value = city; searchBtn.click(); });
    historyList.appendChild(li);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateWeatherIconTheme(theme) {
  const icon = document.getElementById('icon');
  if(!icon) return;
  const weatherType = icon.classList[1]; // clear, clouds, etc
  const darkSuffix = theme === 'dark' ? '-dark' : '';
  icon.style.backgroundImage = `url('../assets/icons/wi-${weatherType}${darkSuffix}.svg')`;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  renderHistory(history);
});
