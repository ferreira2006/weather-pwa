const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");

const weatherDiv = document.getElementById("weather");
const cityNameEl = document.getElementById("city-name");
const iconEl = document.getElementById("icon");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const detailsEl = document.getElementById("details");
const spinner = document.getElementById("spinner");
const errorMessageDiv = document.getElementById("error-message");
const themeToggle = document.getElementById("theme-toggle");

const historyListEl = document.getElementById("history-list");
const maxHistoryItems = 5; // Máximo de cidades no histórico

const favBtn = document.getElementById("fav-btn");
const favoritesListEl = document.getElementById("favorites-list");

// Atualiza estilos que dependem do tema (cores em elementos)
function updateThemeColors() {
  const isDark = document.body.classList.contains("dark");
  
  // Inputs
  cityInput.style.color = isDark ? getComputedStyle(document.documentElement).getPropertyValue('--input-text-dark') : getComputedStyle(document.documentElement).getPropertyValue('--input-text-light');
  cityInput.style.backgroundColor = isDark ? 'rgba(255 255 255 / 0.1)' : 'rgba(255 255 255 / 0.9)';
  
  // Botão buscar
  searchBtn.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-bg').trim();
  searchBtn.style.color = isDark ? '#ddd' : '#fff';

  // Histórico - itens
  const historyItems = historyListEl.querySelectorAll('li');
  historyItems.forEach(li => {
    li.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-bg').trim();
    li.style.color = isDark ? '#ddd' : '#fff';
  });

  // Favoritos (se existir)
  if (favoritesListEl) {
    const favItems = favoritesListEl.querySelectorAll('li');
    favItems.forEach(li => {
      li.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-bg').trim();
      li.style.color = isDark ? '#ddd' : '#fff';
    });
  }

  // Detalhes do clima
  detailsEl.style.color = isDark ? '#ddd' : '#000';

  // Erro
  errorMessageDiv.style.color = isDark ? '#ffbaba' : '#b00000';
  errorMessageDiv.style.backgroundColor = isDark ? '#5c0000' : '#ffdede';

  // Theme toggle button (texto e borda)
  themeToggle.style.color = isDark ? '#ddd' : '#000';
  themeToggle.style.borderColor = isDark ? '#ddd' : '#000';
}

// Aplica tema salvo ou padrão "light"
function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
    themeToggle.textContent = "Modo Claro";
    themeToggle.setAttribute("aria-pressed", "true");
  } else {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
    themeToggle.textContent = "Modo Escuro";
    themeToggle.setAttribute("aria-pressed", "false");
  }
  updateThemeColors();
}

// Formata horário do UNIX timestamp + timezone
function formatTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toUTCString().match(/(\d{2}:\d{2}:\d{2})/)[0];
}

// Atualiza o background conforme clima e tema
function setDynamicBackground(mainWeather) {
  const body = document.body;
  const theme = body.classList.contains("dark") ? "dark" : "light";

  const gradients = {
    light: {
      clear: "var(--bg-gradient-light-clear)",
      clouds: "var(--bg-gradient-light-clouds)",
      rain: "var(--bg-gradient-light-rain)",
      drizzle: "var(--bg-gradient-light-rain)",
      thunderstorm: "var(--bg-gradient-light-thunderstorm)",
      snow: "var(--bg-gradient-light-snow)",
    },
    dark: {
      clear: "var(--bg-gradient-dark-clear)",
      clouds: "var(--bg-gradient-dark-clouds)",
      rain: "var(--bg-gradient-dark-rain)",
      drizzle: "var(--bg-gradient-dark-rain)",
      thunderstorm: "var(--bg-gradient-dark-thunderstorm)",
      snow: "var(--bg-gradient-dark-snow)",
    },
  };

  const weatherKey = mainWeather.toLowerCase();
  const gradient = gradients[theme][weatherKey] || gradients[theme].clear;

  body.style.background = gradient;
  body.style.transition = "background 0.75s ease";
}

// Exibe os dados do clima na tela
function showWeather(data) {
  errorMessageDiv.style.display = "none";

  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
  descEl.textContent = data.weather[0].description;

  const feelsLike = Math.round(data.main.feels_like);
  const humidity = data.main.humidity;
  const windSpeed = data.wind.speed;

  detailsEl.innerHTML = `
    Sensação: ${feelsLike}ºC<br/>
    Umidade: ${humidity}%<br/>
    Vento: ${windSpeed} m/s
  `;

  // Ícone
  const mainWeather = data.weather[0].main.toLowerCase();

  iconEl.className = "weather-icon"; // reset classes

  if (mainWeather.includes("clear")) iconEl.classList.add("clear");
  else if (mainWeather.includes("cloud")) iconEl.classList.add("clouds");
  else if (mainWeather.includes("rain") || mainWeather.includes("drizzle")) iconEl.classList.add("rain");
  else if (mainWeather.includes("thunderstorm")) iconEl.classList.add("thunderstorm");
  else if (mainWeather.includes("snow")) iconEl.classList.add("snow");
  else iconEl.classList.add("clear");

  setDynamicBackground(mainWeather);
  updateThemeColors();

  weatherDiv.style.display = "grid";
  weatherDiv.focus();
}

// Exibe mensagem de erro
function showError(message) {
  weatherDiv.style.display = "none";
  errorMessageDiv.textContent = message;
  errorMessageDiv.style.display = "block";
  errorMessageDiv.focus();
}

// Faz a busca do clima pela cidade
async function fetchWeather(city) {
  spinner.style.display = "block";
  searchBtn.disabled = true;
  favBtn.disabled = true;
  errorMessageDiv.style.display = "none";

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=1`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();
    spinner.style.display = "none";
    searchBtn.disabled = false;
    favBtn.disabled = false;
    return data;
  } catch (err) {
    spinner.style.display = "none";
    searchBtn.disabled = false;
    favBtn.disabled = false;
    throw err;
  }
}

// Busca o clima por coordenadas (geolocalização)
async function fetchByCoords(lat, lon) {
  spinner.style.display = "block";
  searchBtn.disabled = true;
  favBtn.disabled = true;
  errorMessageDiv.style.display = "none";

  try {
    const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}&days=1`);
    if (!res.ok) throw new Error("Não foi possível obter o clima para sua localização.");
    const data = await res.json();
    spinner.style.display = "none";
    searchBtn.disabled = false;
    favBtn.disabled = false;

    showWeather(data);
    saveHistory(data.name);
    renderHistory();
  } catch (err) {
    spinner.style.display = "none";
    searchBtn.disabled = false;
    favBtn.disabled = false;
    showError(err.message);
  }
}

// Histórico em localStorage
function getHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  return history;
}

function saveHistory(city) {
  let history = getHistory();
  // Remove se já existir
  history = history.filter((c) => c.toLowerCase() !== city.toLowerCase());
  // Adiciona no topo
  history.unshift(city);
  if (history.length > maxHistoryItems) history = history.slice(0, maxHistoryItems);
  localStorage.setItem("weatherHistory", JSON.stringify(history));
}

function renderHistory() {
  const history = getHistory();
  historyListEl.innerHTML = "";
  history.forEach((city) => {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.textContent = city;
    li.addEventListener("click", () => handleCitySelect(city));
    li.addEventListener("keydown", e => {
      if(e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCitySelect(city);
      }
    });
    historyListEl.appendChild(li);
  });
  updateThemeColors();
}

// Favoritos em localStorage
function getFavorites() {
  return JSON.parse(localStorage.getItem("weatherFavorites")) || [];
}

function saveFavorites(favorites) {
  localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
}

function addFavorite(city) {
  let favorites = getFavorites();
  if (favorites.find((c) => c.toLowerCase() === city.toLowerCase())) {
    alert(`"${city}" já está nos favoritos.`);
    return;
  }
  favorites.push(city);
  saveFavorites(favorites);
  renderFavorites();
}

function removeFavorite(city) {
  let favorites = getFavorites();
  favorites = favorites.filter((c) => c.toLowerCase() !== city.toLowerCase());
  saveFavorites(favorites);
  renderFavorites();
}

function renderFavorites() {
  const favorites = getFavorites();
  favoritesListEl.innerHTML = "";
  favorites.forEach((city) => {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.textContent = city;

    // Clique simples busca o clima
    li.addEventListener("click", () => handleCitySelect(city));

    // Clique com Shift remove dos favoritos
    li.addEventListener("keydown", (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") || (e.key === "Enter" && e.shiftKey)) {
        e.preventDefault();
        removeFavorite(city);
      }
    });

    // Info extra: shift+enter remove favorito
    li.title = "Clique para buscar. Pressione Shift+Enter ou Delete para remover dos favoritos.";

    favoritesListEl.appendChild(li);
  });
  updateThemeColors();
}

// Quando seleciona uma cidade para buscar clima
async function handleCitySelect(city) {
  cityInput.value = city;
  try {
    const data = await fetchWeather(city);
    showWeather(data);
    saveHistory(city);
    renderHistory();
  } catch (err) {
    showError(err.message || "Erro ao buscar o clima");
  }
}

// Eventos
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return;
  handleCitySelect(city);
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchBtn.click();
  }
});

favBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return alert("Digite uma cidade para adicionar aos favoritos.");
  addFavorite(city);
});

themeToggle.addEventListener("click", () => {
  if (document.body.classList.contains("light")) {
    document.body.classList.replace("light", "dark");
    themeToggle.textContent = "Modo Claro";
    themeToggle.setAttribute("aria-pressed", "true");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.replace("dark", "light");
    themeToggle.textContent = "Modo Escuro";
    themeToggle.setAttribute("aria-pressed", "false");
    localStorage.setItem("theme", "light");
  }
  updateThemeColors();
});

// Inicialização com fallback para geolocalização e cidade padrão
window.onload = () => {
  applySavedTheme();
  renderHistory();
  renderFavorites();

  const lastCity = localStorage.getItem("lastCity");

  if (lastCity) {
    handleCitySelect(lastCity);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => {
        // Usuário negou ou erro - carrega cidade padrão
        handleCitySelect("São Miguel do Oeste");
      }
    );
  } else {
    // Sem geolocalização suportada - carrega cidade padrão
    handleCitySelect("São Miguel do Oeste");
  }
};
