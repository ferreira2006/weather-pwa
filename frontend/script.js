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

// ===== NORMALIZAÇÃO DE INPUT =====
function normalizeCityInput(city) {
  if (!city) return "";
  city = city.replace(/[’‘]/g, "'"); // apóstrofos tipográficos
  city = city.trim().replace(/\s+/g, " "); // remove espaços extras
  return city;
}

// ===== ELEMENTOS DOM =====
const dom = {
  cityInput: document.getElementById("city-input"),
  searchBtn: document.getElementById("search-btn"),
  favBtn: document.getElementById("fav-btn"),
  themeToggle: document.getElementById("theme-toggle"),

  weatherDiv: document.getElementById("weather"),
  weatherContent: document.getElementById("weather-content"),
  weatherError: document.getElementById("weather-error"),
  overlay: document.getElementById("overlay"),
  spinner: document.getElementById("spinner"),

  cityNameEl: document.getElementById("city-name"),
  iconEl: document.getElementById("icon"),
  tempEl: document.getElementById("temp"),
  descEl: document.getElementById("desc"),
  detailsEl: document.getElementById("details"),

  historyListEl: document.getElementById("history-list"),
  favoritesListEl: document.getElementById("favorites-list"),

  toast: document.getElementById("toast"),
};

// ===== ESTADO GLOBAL =====
let currentCityValid = false;
let firstLoad = true;

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
    let history = this.getHistory().filter(c => c.toLowerCase() !== formattedCity.toLowerCase());
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
  showOverlay() {
    dom.overlay.hidden = false;
    dom.spinner.hidden = false;
    dom.weatherDiv.style.visibility = "hidden"; // evita mostrar card parcialmente
  },
  hideOverlay() {
    dom.overlay.hidden = true;
    dom.spinner.hidden = true;
    dom.weatherDiv.style.visibility = "visible";
  },
  isValidCityInput(city) {
    if (!city) return false;
    const normalized = normalizeCityInput(city);
    return /^[\p{L}\s'-]+$/u.test(normalized);
  },
  showToast(message, duration = 3000) {
    const t = dom.toast;
    t.textContent = message;
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), duration);
  },
  setDynamicBackground(mainWeather) {
    const classes = ["bg-clear", "bg-clouds", "bg-rain", "bg-thunderstorm", "bg-snow"];
    document.body.classList.remove(...classes);
    mainWeather = mainWeather.toLowerCase();
    let key = "clear";
    if (mainWeather.includes("cloud")) key = "clouds";
    else if (mainWeather.includes("rain") || mainWeather.includes("drizzle")) key = "rain";
    else if (mainWeather.includes("thunderstorm")) key = "thunderstorm";
    else if (mainWeather.includes("snow")) key = "snow";
    document.body.classList.add(`bg-${key}`);
  },
  showWeather(data) {
    document.body.classList.remove("error");
    dom.weatherError.style.display = "none";
    dom.weatherContent.style.display = "block";
    dom.iconEl.style.display = "block";

    dom.cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    dom.descEl.textContent = data.weather[0].description;
    dom.detailsEl.innerHTML = `Sensação: ${Math.round(data.main.feels_like)}ºC<br/>Umidade: ${data.main.humidity}%<br/>Vento: ${data.wind.speed} m/s`;

    dom.iconEl.className = "weather-icon";
    dom.iconEl.classList.add(data.weather[0].main.toLowerCase());

    dom.weatherDiv.hidden = false;
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    currentCityValid = true;
    firstLoad = false;
    App.updateButtonsState();
    this.setDynamicBackground(data.weather[0].main);
  },
  showError(message) {
    document.body.classList.add("error");
    dom.weatherError.textContent = message;
    dom.weatherError.style.display = "block";
    dom.weatherContent.style.display = "none";
    dom.iconEl.style.display = "none";
    dom.weatherDiv.hidden = false;
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    currentCityValid = false;
    App.updateButtonsState();
  }
};

// ===== APP =====
const App = {
  async handleCitySelect(city) {
    const normalizedCity = normalizeCityInput(city);
    if (!normalizedCity) return;

    UI.showOverlay();
    try {
      const data = await WeatherAPI.fetchByCity(normalizedCity);
      UI.showWeather(data);
      Storage.saveHistory(data.name);
      Storage.saveLastCity(data.name);
    } catch (err) {
      UI.showError(err.message);
    } finally {
      UI.hideOverlay();
      UI.renderHistory();
      this.updateButtonsState();
    }
  },
  async fetchByCoords(lat, lon) {
    UI.showOverlay();
    try {
      const data = await WeatherAPI.fetchByCoords(lat, lon);
      UI.showWeather(data);
      Storage.saveHistory(data.name);
      Storage.saveLastCity(data.name);
    } catch (err) {
      UI.showError(err.message);
      if (!Storage.getLastCity()) await this.handleCitySelect("São Miguel do Oeste");
    } finally {
      UI.hideOverlay();
      UI.renderHistory();
      this.updateButtonsState();
    }
  },
  updateButtonsState() {
    const city = dom.cityInput.value.trim();
    const valid = UI.isValidCityInput(city) && currentCityValid;
    dom.searchBtn.disabled = !valid;
    dom.favBtn.disabled = !valid;
  },
  init() {
    UI.renderHistory();
    UI.renderFavorites();

    const lastCity = Storage.getLastCity();
    if (lastCity) this.handleCitySelect(lastCity);
    else if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      pos => this.fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => this.handleCitySelect("São Miguel do Oeste")
    );
  }
};

window.onload = () => App.init();
