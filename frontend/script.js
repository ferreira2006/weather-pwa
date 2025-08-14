const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ===== UTILS =====
function capitalizeCityName(city) {
  return city
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeCityInput(city) {
  if (!city) return "";
  city = city.replace(/[’‘]/g, "'"); // apóstrofos tipográficos
  city = city.trim().replace(/\s+/g, " "); // remove espaços extras
  return city;
}

// ===== DOM =====
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
  confirmModal: document.getElementById("confirm-modal"),
  confirmDesc: document.getElementById("confirm-modal-desc"),
  confirmYes: document.getElementById("confirm-yes"),
  confirmNo: document.getElementById("confirm-no"),
};

// ===== STATE =====
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
  getHistory() {
    return JSON.parse(localStorage.getItem("weatherHistory")) || [];
  },
  saveHistory(city) {
    const formattedCity = capitalizeCityName(city);
    let history = this.getHistory();
    history = history.filter(c => c.toLowerCase() !== formattedCity.toLowerCase());
    history.unshift(formattedCity);
    if (history.length > maxHistoryItems) history = history.slice(0, maxHistoryItems);
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  },
  getFavorites() {
    return JSON.parse(localStorage.getItem("weatherFavorites")) || [];
  },
  saveFavorites(favorites) {
    localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
  },
  getTheme() {
    return localStorage.getItem("theme") || "light";
  },
  saveTheme(theme) {
    localStorage.setItem("theme", theme);
  },
  getLastCity() {
    return localStorage.getItem("lastCity");
  },
  saveLastCity(city) {
    localStorage.setItem("lastCity", city);
  }
};

// ===== UI =====
const UI = {
  isValidCityInput(city) {
    if (!city) return false;
    const normalized = normalizeCityInput(city);
    const validCityRegex = /^[\p{L}\s'-]+$/u;
    return validCityRegex.test(normalized);
  },

  showToast(message, duration = 3000) {
    if (!dom.toast) return;
    const t = dom.toast;
    t.textContent = message;
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
    t.setAttribute("aria-live", "polite");
    setTimeout(() => t.classList.remove("show"), duration);
  },

  setDynamicBackground(mainWeather) {
    if (!document.body) return;
    const classes = ["bg-clear", "bg-clouds", "bg-rain", "bg-thunderstorm", "bg-snow"];
    document.body.classList.remove(...classes);
    mainWeather = mainWeather.toLowerCase();
    let weatherKey = "clear";
    if (mainWeather.includes("cloud")) weatherKey = "clouds";
    else if (mainWeather.includes("rain") || mainWeather.includes("drizzle")) weatherKey = "rain";
    else if (mainWeather.includes("thunderstorm")) weatherKey = "thunderstorm";
    else if (mainWeather.includes("snow")) weatherKey = "snow";
    document.body.classList.add(`bg-${weatherKey}`);
  },

  setDynamicBackgroundFromCurrentIcon() {
    if (!dom.weatherDiv || !dom.iconEl) return;
    if (!dom.weatherDiv.hidden) {
      const mainClass = [...dom.iconEl.classList].find(c => c !== "weather-icon");
      this.setDynamicBackground(mainClass || "clear");
    } else this.setDynamicBackground("clear");
  },

  showWeather(data) {
    if (!dom.weatherDiv) return;
    document.body.classList.remove("error");
    if (dom.weatherError) { dom.weatherError.style.display = "none"; dom.weatherError.style.opacity = "0"; }
    if (dom.weatherContent) dom.weatherContent.style.display = "block";
    if (dom.iconEl) dom.iconEl.style.display = "block";

    if (dom.cityNameEl) dom.cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    if (dom.tempEl) dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    if (dom.descEl) dom.descEl.textContent = data.weather[0].description;
    if (dom.detailsEl) dom.detailsEl.innerHTML = `Sensação: ${Math.round(data.main.feels_like)}ºC<br/>Umidade: ${data.main.humidity}%<br/>Vento: ${data.wind.speed} m/s`;

    if (dom.iconEl) {
      dom.iconEl.className = "weather-icon";
      dom.iconEl.classList.add(data.weather[0].main.toLowerCase());
    }

    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    currentCityValid = true;
    firstLoad = false;
    App.updateButtonsState();
    this.setDynamicBackground(data.weather[0].main);
  },

  showError(message) {
    document.body.classList.add("error");
    if (dom.weatherError) { dom.weatherError.textContent = message; dom.weatherError.style.display = "block"; dom.weatherError.style.opacity = "1"; }
    if (dom.weatherContent) dom.weatherContent.style.display = "none";
    if (dom.iconEl) dom.iconEl.style.display = "none";
    if (dom.weatherDiv) { dom.weatherDiv.hidden = false; dom.weatherDiv.focus(); dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" }); }
    currentCityValid = false;
    App.updateButtonsState();
  },

  // ... restante do UI (renderHistory, renderFavorites, toggleThemeColors, applySavedTheme)
  // adicionar verificações null semelhantes para todos os elementos do DOM
};

// ===== APP =====
const App = {
  // ... funções handleCitySelect, fetchByCoords, addFavorite, removeFavorite, updateButtonsState, init
  // garantir checagem de null para elementos do DOM em todos os acessos
};

function showConfirmationModal(message) {
  if (!dom.confirmModal || !dom.confirmYes || !dom.confirmNo || !dom.confirmDesc) return Promise.resolve(false);
  return new Promise((resolve) => {
    dom.confirmDesc.textContent = message;
    dom.confirmModal.hidden = false;
    dom.confirmModal.focus();

    function cleanUp() {
      dom.confirmYes.removeEventListener("click", onYes);
      dom.confirmNo.removeEventListener("click", onNo);
    }

    function onYes() { cleanUp(); dom.confirmModal.hidden = true; resolve(true); }
    function onNo() { cleanUp(); dom.confirmModal.hidden = true; resolve(false); }

    dom.confirmYes.addEventListener("click", onYes);
    dom.confirmNo.addEventListener("click", onNo);
  });
}

window.onload = () => App.init();
