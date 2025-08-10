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
const maxHistoryItems = 5;

const favBtn = document.getElementById("fav-btn");
const favoritesListEl = document.getElementById("favorites-list");

// Atualiza estilos que dependem do tema (cores e background)
function updateThemeColors() {
  const isDark = document.body.classList.contains("dark");
  
  cityInput.style.color = isDark ? getComputedStyle(document.documentElement).getPropertyValue('--input-text-dark') : getComputedStyle(document.documentElement).getPropertyValue('--input-text-light');
  cityInput.style.backgroundColor = isDark ? 'rgba(255 255 255 / 0.1)' : 'rgba(255 255 255 / 0.9)';
  
  searchBtn.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-bg').trim();
  searchBtn.style.color = isDark ? '#ddd' : '#fff';

  const historyItems = historyListEl.querySelectorAll('li');
  historyItems.forEach(li => {
    li.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-bg').trim();
    li.style.color = isDark ? '#ddd' : '#fff';
  });

  if (favoritesListEl) {
    const favItems = favoritesListEl.querySelectorAll('li');
    favItems.forEach(li => {
      li.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-bg').trim();
      li.style.color = isDark ? '#ddd' : '#fff';
    });
  }

  detailsEl.style.color = isDark ? '#ddd' : '#000';

  errorMessageDiv.style.color = isDark ? '#ffbaba' : '#b00000';
  errorMessageDiv.style.backgroundColor = isDark ? '#5c0000' : '#ffdede';

  themeToggle.style.color = isDark ? '#ddd' : '#000';
  themeToggle.style.borderColor = isDark ? '#ddd' : '#000';
}

// Atualiza texto e aria-pressed do botão de tema
function updateThemeToggleButton() {
  if (document.body.classList.contains("dark")) {
    themeToggle.textContent = "Modo Claro";
    themeToggle.setAttribute("aria-pressed", "true");
  } else {
    themeToggle.textContent = "Modo Escuro";
    themeToggle.setAttribute("aria-pressed", "false");
  }
}

// Aplica tema salvo ou padrão "light"
function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
  } else {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
  }
  updateThemeColors();
  updateThemeToggleButton();

  // Atualiza o background inicial de acordo com tema e clima atual
  if (weatherDiv.style.display !== "none") {
    const mainWeather = iconEl.className.replace("weather-icon", "").trim().toLowerCase();
    if (mainWeather) setDynamicBackground(mainWeather);
  } else {
    setDynamicBackground("clear");
  }
}

// Alterna o tema ao clicar no botão
function toggleTheme() {
  if (document.body.classList.contains("light")) {
    document.body.classList.replace("light", "dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.replace("dark", "light");
    localStorage.setItem("theme", "light");
  }
  updateThemeColors();
  updateThemeToggleButton();

  // Atualiza background conforme tema atual e clima
  if (weatherDiv.style.display !== "none") {
    const mainWeather = iconEl.className.replace("weather-icon", "").trim().toLowerCase();
    if (mainWeather) setDynamicBackground(mainWeather);
  } else {
    setDynamicBackground("clear");
  }
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
  history = history.filter((c) => c.toLowerCase() !== city.toLowerCase());
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

    // Span para nome da cidade (busca ao clicar)
    const citySpan = document.createElement("span");
    citySpan.textContent = city;
    citySpan.style.cursor = "pointer";
    citySpan.title = "Clique para buscar";
    citySpan.addEventListener("click", () => handleCitySelect(city));

    // Botão de remover favorito
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.title = "Remover dos favoritos";
    removeBtn.style.marginLeft = "8px";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.background = "transparent";
    removeBtn.style.border = "none";
    removeBtn.style.color = "inherit";
    removeBtn.style.fontWeight = "bold";
    removeBtn.style.fontSize = "1.2rem";
    removeBtn.style.lineHeight = "1";
    removeBtn.style.padding = "0";

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFavorite(city);
    });

    li.appendChild(citySpan);
    li.appendChild(removeBtn);

    // Remoção via teclado (Shift+Enter, Delete, Backspace)
    li.addEventListener("keydown", (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") || (e.key === "Enter" && e.shiftKey)) {
        e.preventDefault();
        removeFavorite(city);
      }
    });

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
    localStorage.setItem("lastCity", city);
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

themeToggle.addEventListener("click", toggleTheme);

// Seleciona todo o texto do input ao receber foco
cityInput.addEventListener('focus', (event) => {
  event.target.select();
});

// Previne que o clique do mouse desfaça a seleção do texto
cityInput.addEventListener('mouseup', (event) => {
  event.preventDefault();
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
        handleCitySelect("São Miguel do Oeste");
      }
    );
  } else {
    handleCitySelect("São Miguel do Oeste");
  }
};
