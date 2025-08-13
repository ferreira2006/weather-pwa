const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// Função para capitalizar cada palavra do nome da cidade
function capitalizeCityName(city) {
  return city
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

// Elementos do DOM agrupados
const dom = {
  cityInput: document.getElementById("city-input"),
  searchBtn: document.getElementById("search-btn"),
  favBtn: document.getElementById("fav-btn"),
  themeToggle: document.getElementById("theme-toggle"),
  weatherDiv: document.getElementById("weather"),
  weatherContent: document.getElementById("weather-content"),
  weatherError: document.getElementById("weather-error"),
  cityNameEl: document.getElementById("city-name"),
  iconEl: document.getElementById("icon"),
  tempEl: document.getElementById("temp"),
  descEl: document.getElementById("desc"),
  detailsEl: document.getElementById("details"),
  spinner: document.getElementById("spinner"),
  historyListEl: document.getElementById("history-list"),
  favoritesListEl: document.getElementById("favorites-list"),
  toast: document.getElementById("toast"),
};

// Estado global simples
let currentCityValid = false;

// ===== API =====
const WeatherAPI = {
  async fetchByCity(city) {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=1`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    return res.json();
  },
  async fetchByCoords(lat, lon) {
    const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}&days=1`);
    if (!res.ok) throw new Error("Não foi possível obter o clima para sua localização.");
    return res.json();
  }
};

// ===== STORAGE =====
const Storage = {
  getHistory() { return JSON.parse(localStorage.getItem("weatherHistory")) || []; },
  saveHistory(city) {
    const formattedCity = capitalizeCityName(city);
    let history = this.getHistory();
    history = history.filter(c => c.toLowerCase() !== formattedCity.toLowerCase());
    history.unshift(formattedCity);
    if (history.length > maxHistoryItems) history = history.slice(0, maxHistoryItems);
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  },
  getFavorites() { return JSON.parse(localStorage.getItem("weatherFavorites")) || []; },
  saveFavorites(favorites) { localStorage.setItem("weatherFavorites", JSON.stringify(favorites)); },
  getTheme() { return localStorage.getItem("theme") || "light"; },
  saveTheme(theme) { localStorage.setItem("theme", theme); },
  getLastCity() { return localStorage.getItem("lastCity"); },
  saveLastCity(city) { localStorage.setItem("lastCity", city); }
};

// ===== UI =====
const UI = {
  // Regex aprimorada: aceita letras Unicode, espaços, hífen e apóstrofos
  isValidCityInput(city) {
    if (!city) return false;
    const validCityRegex = /^[\p{L}\s'-’]+$/u;
    return validCityRegex.test(city.trim());
  },

  showToast(message, duration = 3000) {
    const t = dom.toast;
    t.textContent = message;
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
    dom.cityInput.focus();
    setTimeout(() => t.classList.remove("show"), duration);
  },

  setDynamicBackground(mainWeather) { /* Mantido seu código */ },
  setDynamicBackgroundFromCurrentIcon() { /* Mantido seu código */ },
  showWeather(data) { /* Mantido seu código */ },
  showError(message) { /* Mantido seu código */ },
  updateThemeColors() { /* Mantido seu código */ },
  updateThemeToggleButton() { /* Mantido seu código */ },
  renderHistory() { /* Mantido seu código */ },
  renderFavorites() { /* Mantido seu código */ },
  toggleThemeColors() { /* Mantido seu código */ },
  applySavedTheme() { /* Mantido seu código */ }
};

// ===== APP (Lógica e eventos) =====
const App = {
  async handleCitySelect(city) { /* Mantido seu código */ },
  async fetchByCoords(lat, lon) { /* Mantido seu código */ },
  addFavorite(city) { /* Mantido seu código */ },
  async removeFavorite(city) { /* Mantido seu código */ },

  // Atualiza estado dos botões com validação aprimorada
  updateButtonsState() {
    const city = dom.cityInput.value.trim().toLowerCase();
    const favorites = Storage.getFavorites().map(c => c.toLowerCase());
    const isCityInFavorites = favorites.includes(city);
    const isCityEmpty = city === '';
    const isValidCity = UI.isValidCityInput(dom.cityInput.value);

    dom.searchBtn.disabled = !isValidCity;
    dom.favBtn.disabled = !isValidCity || isCityEmpty || isCityInFavorites || (favorites.length >= 5);

    if (favorites.length >= 5) dom.favBtn.title = "Limite de 5 cidades favoritas atingido.";
    else dom.favBtn.title = "";
  },

  init() {
    UI.applySavedTheme();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateButtonsState();

    const searchForm = document.getElementById("search-box");
    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      const city = dom.cityInput.value.trim();
      if (!UI.isValidCityInput(city)) {
        UI.showToast("Por favor, informe uma cidade válida (letras, espaços, hífen, apóstrofo).");
        dom.cityInput.focus();
        return;
      }
      this.handleCitySelect(city);
    });

    dom.cityInput.addEventListener("input", () => {
      currentCityValid = false;
      this.updateButtonsState();
    });

    dom.favBtn.addEventListener("click", () => {
      const city = dom.cityInput.value.trim();
      if (!city) return;
      this.addFavorite(city);
    });

    dom.themeToggle.addEventListener("click", () => UI.toggleThemeColors());

    const lastCity = Storage.getLastCity();
    if (lastCity) this.handleCitySelect(lastCity);
    else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => this.fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        () => this.handleCitySelect("São Miguel do Oeste")
      );
    } else this.handleCitySelect("São Miguel do Oeste");
  }
};

function showConfirmationModal(message) { /* Mantido seu código */ }

// Inicializa app
window.onload = () => App.init();
