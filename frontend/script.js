const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const body = document.body;
const themeToggleBtn = document.getElementById("theme-toggle");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const favBtn = document.getElementById("fav-btn");
const weatherSection = document.getElementById("weather");
const iconEl = document.getElementById("icon");
const cityNameEl = document.getElementById("city-name");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const detailsEl = document.getElementById("details");
const spinner = document.getElementById("spinner");
const favoritesList = document.getElementById("favorites-list");
const historyList = document.getElementById("history-list");
const errorMessage = document.getElementById("error-message");
const toast = document.getElementById("toast");

let currentCity = "";
let currentWeatherMain = "";
let currentTheme = "light";
let favorites = [];
let history = [];

// --- Inicialização ---
init();

function init() {
  loadTheme();
  loadFavorites();
  loadHistory();
  attachListeners();
  updateFavBtn();
}

function attachListeners() {
  themeToggleBtn.addEventListener("click", toggleTheme);
  searchBtn.addEventListener("click", onSearch);
  cityInput.addEventListener("keyup", e => {
    if (e.key === "Enter") onSearch();
    updateFavBtn();
  });
  favBtn.addEventListener("click", toggleFavorite);
  favoritesList.addEventListener("click", onFavoriteClick);
  historyList.addEventListener("click", onHistoryClick);
}

// --- Tema ---
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") currentTheme = "dark";
  else currentTheme = "light";
  applyTheme();
}

function applyTheme() {
  body.classList.remove("light", "dark");
  body.classList.add(currentTheme);
  themeToggleBtn.textContent = currentTheme === "light" ? "Modo Escuro" : "Modo Claro";
  themeToggleBtn.setAttribute("aria-pressed", currentTheme === "dark");
  updateBodyBackground();
  localStorage.setItem("theme", currentTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  applyTheme();
}

// --- Busca e atualização do clima ---
async function onSearch() {
  const city = cityInput.value.trim();
  if (!city) return showError("Por favor, digite o nome de uma cidade.");
  showError(""); // limpa erro
  setLoading(true);

  try {
    const data = await fetchWeather(city);
    if (!data || data.cod !== 200 && data.cod !== "200") {
      showError("Cidade não encontrada. Tente outro nome.");
      setLoading(false);
      return;
    }
    updateWeather(data);
    addToHistory(city);
    currentCity = city;
    updateFavBtn();
  } catch (error) {
    showError("Erro ao buscar o clima. Tente novamente.");
  }
  setLoading(false);
}

async function fetchWeather(city) {
  const url = `${backendUrl}?city=${encodeURIComponent(city)}&days=1`;
  const res = await fetch(url);
  return res.json();
}

function updateWeather(data) {
  if (!data.weather || !data.weather[0]) return;
  const weatherMain = data.weather[0].main.toLowerCase();
  const weatherDesc = data.weather[0].description;
  const tempC = data.main.temp;
  const cityName = data.name;

  // Atualiza texto
  cityNameEl.textContent = cityName;
  tempEl.textContent = `${tempC.toFixed(1)} °C`;
  descEl.textContent = weatherDesc;
  detailsEl.textContent = `Umidade: ${data.main.humidity}% | Vento: ${data.wind.speed} m/s`;

  // Atualiza ícone/classe
  iconEl.className = "weather-icon"; // limpa
  if (weatherMain.includes("clear")) iconEl.classList.add("clear");
  else if (weatherMain.includes("cloud")) iconEl.classList.add("clouds");
  else if (weatherMain.includes("rain")) iconEl.classList.add("rain");
  else if (weatherMain.includes("thunderstorm")) iconEl.classList.add("thunderstorm");
  else if (weatherMain.includes("snow")) iconEl.classList.add("snow");
  else iconEl.classList.add("clouds"); // fallback

  // Atualiza fundo do body (remove antigos bg-*)
  body.classList.forEach(c => {
    if (c.startsWith("bg-")) body.classList.remove(c);
  });

  // Mapeia clima para classe de fundo (simplificado)
  let bgClass = "bg-clouds";
  if (weatherMain.includes("clear")) bgClass = "bg-clear";
  else if (weatherMain.includes("cloud")) bgClass = "bg-clouds";
  else if (weatherMain.includes("rain")) bgClass = "bg-rain";
  else if (weatherMain.includes("thunderstorm")) bgClass = "bg-thunderstorm";
  else if (weatherMain.includes("snow")) bgClass = "bg-snow";

  body.classList.add(bgClass);

  weatherSection.hidden = false;
  currentWeatherMain = weatherMain;
}

// --- Loading & UI state ---
function setLoading(loading) {
  if (loading) {
    weatherSection.classList.add("loading");
    spinner.style.display = "block";
    searchBtn.disabled = true;
    favBtn.disabled = true;
  } else {
    weatherSection.classList.remove("loading");
    spinner.style.display = "none";
    searchBtn.disabled = false;
    updateFavBtn();
  }
}

// --- Favoritos ---
function loadFavorites() {
  try {
    favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  } catch {
    favorites = [];
  }
  renderFavorites();
}

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function renderFavorites() {
  favoritesList.innerHTML = "";
  favorites.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.tabIndex = 0;
    const btn = document.createElement("button");
    btn.className = "remove-fav-btn";
    btn.setAttribute("aria-label", `Remover ${city} dos favoritos`);
    btn.textContent = "×";
    btn.dataset.city = city;
    li.appendChild(btn);
    favoritesList.appendChild(li);
  });
}

function toggleFavorite() {
  if (!currentCity) return;
  const idx = favorites.indexOf(currentCity);
  if (idx === -1) {
    favorites.push(currentCity);
    showToast(`${currentCity} adicionada aos favoritos!`);
  } else {
    favorites.splice(idx, 1);
    showToast(`${currentCity} removida dos favoritos!`);
  }
  saveFavorites();
  renderFavorites();
  updateFavBtn();
}

function updateFavBtn() {
  if (!currentCity) {
    favBtn.disabled = true;
    return;
  }
  favBtn.disabled = false;
  if (favorites.includes(currentCity)) {
    favBtn.textContent = "Remover Favorito";
  } else {
    favBtn.textContent = "Favorito";
  }
}

// --- Histórico ---
function loadHistory() {
  try {
    history = JSON.parse(localStorage.getItem("history")) || [];
  } catch {
    history = [];
  }
  renderHistory();
}

function saveHistory() {
  localStorage.setItem("history", JSON.stringify(history));
}

function addToHistory(city) {
  city = city.trim();
  if (!city) return;
  // Remove se já existe
  history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
  // Adiciona no início
  history.unshift(city);
  // Limita a 10 itens
  if (history.length > 10) history.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.tabIndex = 0;
    historyList.appendChild(li);
  });
}

// --- Eventos das listas ---
function onFavoriteClick(event) {
  if (event.target.classList.contains("remove-fav-btn")) {
    const city = event.target.dataset.city;
    favorites = favorites.filter(c => c !== city);
    saveFavorites();
    renderFavorites();
    updateFavBtn();
    showToast(`${city} removida dos favoritos!`);
  } else if (event.target.tagName === "LI") {
    cityInput.value = event.target.textContent;
    onSearch();
  }
}

function onHistoryClick(event) {
  if (event.target.tagName === "LI") {
    cityInput.value = event.target.textContent;
    onSearch();
  }
}

// --- Mensagens ---
function showError(msg) {
  if (!msg) {
    errorMessage.hidden = true;
    errorMessage.textContent = "";
  } else {
    errorMessage.textContent = msg;
    errorMessage.hidden = false;
    errorMessage.focus();
  }
}

function showToast(msg) {
  if (!msg) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
