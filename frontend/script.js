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

// Funções do spinner
function showSpinner() {
  dom.spinner.classList.remove("hidden");
}

function hideSpinner() {
  dom.spinner.classList.add("hidden");
}

// Elementos DOM
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

// Estado global
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
    const t = dom.toast;
    t.textContent = message;
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
    t.setAttribute("aria-live", "polite");
    setTimeout(() => t.classList.remove("show"), duration);
  },

  setDynamicBackground(mainWeather) {
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
    if (!dom.weatherDiv.hidden) {
      const mainClass = [...dom.iconEl.classList].find(c => c !== "weather-icon");
      this.setDynamicBackground(mainClass || "clear");
    } else this.setDynamicBackground("clear");
  },

  showWeather(data) {
    hideSpinner();
    document.body.classList.remove("error");
    dom.weatherError.style.display = "none";
    dom.weatherError.style.opacity = "0";

    dom.cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    dom.descEl.textContent = data.weather[0].description;
    dom.detailsEl.innerHTML = `Sensação: ${Math.round(data.main.feels_like)}ºC<br/>Umidade: ${data.main.humidity}%<br/>Vento: ${data.wind.speed} m/s`;

    dom.iconEl.className = "weather-icon";
    dom.iconEl.classList.add(data.weather[0].main.toLowerCase());

    dom.weatherDiv.hidden = false;
    currentCityValid = true;

    requestAnimationFrame(() => {
      dom.weatherDiv.classList.remove("loading");
      dom.weatherContent.style.visibility = "visible";
      dom.iconEl.style.visibility = "visible";
      dom.weatherDiv.focus();
      dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    App.updateButtonsState();
    this.setDynamicBackground(data.weather[0].main);
  },

  showError(message) {
    hideSpinner();
    document.body.classList.add("error");
    dom.weatherError.textContent = message;
    dom.weatherError.style.display = "block";
    dom.weatherError.style.opacity = "1";
    dom.weatherContent.style.visibility = "hidden";
    dom.iconEl.style.visibility = "hidden";
    dom.weatherDiv.hidden = false;
    dom.weatherDiv.classList.remove("loading");
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    currentCityValid = false;
    App.updateButtonsState();
  },

  updateThemeColors() {
    const rootStyles = getComputedStyle(document.documentElement);
    const isDark = document.body.classList.contains("dark");
    dom.cityInput.style.color = isDark ? rootStyles.getPropertyValue('--input-text-dark').trim() : rootStyles.getPropertyValue('--input-text-light').trim();
    dom.cityInput.style.backgroundColor = isDark ? rootStyles.getPropertyValue('--input-bg-dark').trim() : rootStyles.getPropertyValue('--input-bg-light').trim();
    const buttonBg = rootStyles.getPropertyValue('--button-bg').trim();
    [dom.searchBtn, dom.favBtn].forEach(btn => {
      btn.style.backgroundColor = buttonBg;
      btn.style.color = isDark ? '#ddd' : '#fff';
    });
    [...dom.historyListEl.children, ...(dom.favoritesListEl ? [...dom.favoritesListEl.children] : [])].forEach(li => {
      li.style.backgroundColor = buttonBg;
      li.style.color = isDark ? '#ddd' : '#fff';
    });
    dom.detailsEl.style.color = isDark ? '#ddd' : '#000';
    dom.weatherError.style.color = isDark ? '#ffbaba' : '#b00000';
    dom.weatherError.style.backgroundColor = isDark ? '#5c0000' : '#ffdede';
    dom.themeToggle.style.color = isDark ? '#ddd' : '#000';
    dom.themeToggle.style.borderColor = isDark ? '#ddd' : '#000';
  },

  updateThemeToggleButton() {
    const isDark = document.body.classList.contains("dark");
    dom.themeToggle.textContent = isDark ? "Modo Claro" : "Modo Escuro";
    dom.themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  },

  renderHistory() {
    const history = Storage.getHistory();
    dom.historyListEl.innerHTML = "";
    history.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.textContent = city;
      li.setAttribute("aria-label", `Buscar clima da cidade ${city}`);
      li.addEventListener("click", () => App.handleCitySelect(city));
      li.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); App.handleCitySelect(city); }
      });
      dom.historyListEl.appendChild(li);
    });
    this.updateThemeColors();
  },

  renderFavorites() {
    const favorites = Storage.getFavorites();
    dom.favoritesListEl.innerHTML = "";
    favorites.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.setAttribute("aria-label", `Cidade favorita ${city}. Pressione Enter para buscar, Delete para remover.`);

      const citySpan = document.createElement("span");
      citySpan.textContent = city;
      citySpan.style.cursor = "pointer";
      citySpan.title = "Clique para buscar";
      citySpan.setAttribute("role", "button");
      citySpan.setAttribute("tabindex", "0");
      citySpan.setAttribute("aria-label", `Buscar clima da cidade ${city}`);
      citySpan.addEventListener("click", () => App.handleCitySelect(city));
      citySpan.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); App.handleCitySelect(city); }
      });

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.title = `Remover ${city} dos favoritos`;
      removeBtn.setAttribute("aria-label", `Remover ${city} dos favoritos`);
      Object.assign(removeBtn.style, { marginLeft: "8px", cursor: "pointer", background: "transparent", border: "none", color: "inherit", fontWeight: "bold", fontSize: "1.2rem", lineHeight: "1", padding: "0", outlineOffset: "2px" });
      removeBtn.addEventListener("click", e => { e.stopPropagation(); App.removeFavorite(city); });

      li.addEventListener("keydown", e => {
        if (["Delete", "Backspace"].includes(e.key) || (e.key === "Enter" && e.shiftKey)) {
          e.preventDefault(); App.removeFavorite(city);
        }
      });

      li.title = "Clique para buscar. Pressione Shift+Enter ou Delete para remover dos favoritos.";
      li.appendChild(citySpan);
      li.appendChild(removeBtn);
      dom.favoritesListEl.appendChild(li);
    });
    this.updateThemeColors();
  },

  toggleThemeColors() {
    const isDark = document.body.classList.contains("dark");
    if (isDark) {
      document.body.classList.remove("dark");
      document.body.classList.add("light");
      Storage.saveTheme("light");
    } else {
      document.body.classList.remove("light");
      document.body.classList.add("dark");
      Storage.saveTheme("dark");
    }
    this.updateThemeColors();
    this.updateThemeToggleButton();
    this.setDynamicBackgroundFromCurrentIcon();
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    if (saved === "dark") {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
    this.updateThemeColors();
    this.updateThemeToggleButton();
    this.setDynamicBackgroundFromCurrentIcon();
  }
};

// ===== APP =====
const App = {
  async handleCitySelect(city) {
    showSpinner();
    dom.weatherContent.style.visibility = "hidden";
    dom.iconEl.style.visibility = "hidden";

    try {
      const normalizedCity = normalizeCityInput(city);
      if (!normalizedCity || (normalizedCity.toLowerCase() === dom.cityInput.value.trim().toLowerCase() && currentCityValid)) return;
      dom.cityInput.value = normalizedCity;
      const data = await WeatherAPI.fetchByCity(normalizedCity);
      UI.showWeather(data);
      Storage.saveHistory(normalizedCity);
      UI.renderHistory();
      Storage.saveLastCity(normalizedCity);
      this.updateButtonsState();
    } catch (err) {
      UI.showError(err.message || "Erro ao buscar o clima");
    }
  },

  async fetchByCoords(lat, lon) {
    showSpinner();
    dom.weatherContent.style.visibility = "hidden";
    dom.iconEl.style.visibility = "hidden";

    try {
      const data = await WeatherAPI.fetchByCoords(lat, lon);
      UI.showWeather(data);
      Storage.saveHistory(data.name);
      UI.renderHistory();
      Storage.saveLastCity(data.name);
      this.updateButtonsState();
    } catch (err) {
      UI.showError(err.message);
      if (!Storage.getLastCity()) {
        await this.handleCitySelect("São Miguel do Oeste");
      }
    }
  },

  addFavorite(city) {
    const normalizedCity = normalizeCityInput(city);
    const formattedCity = capitalizeCityName(normalizedCity);
    let favorites = Storage.getFavorites();
    if (favorites.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
      UI.showToast(`"${formattedCity}" já está nos favoritos.`);
      return;
    }
    if (favorites.length >= 5) {
      UI.showToast("Limite de 5 cidades favoritas atingido.");
      return;
    }
    favorites.push(formattedCity);
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${formattedCity}" adicionado aos favoritos!`);
    this.updateButtonsState();
  },

  async removeFavorite(city) {
    const confirmed = await showConfirmationModal(`Tem certeza que deseja remover "${city}" dos favoritos?`);
    if (!confirmed) return;
    let favorites = Storage.getFavorites();
    favorites = favorites.filter(c => c.toLowerCase() !== city.toLowerCase());
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${city}" removido dos favoritos.`);
    this.updateButtonsState();
  },

  updateButtonsState() {
    const city = dom.cityInput.value.trim();
    const favorites = Storage.getFavorites().map(c => c.toLowerCase());
    const cityLower = city.toLowerCase();
    const isCityEmpty = city === '';
    const isCityValid = UI.isValidCityInput(city);
    dom.searchBtn.disabled = !isCityValid;
    let canAddFavorite = currentCityValid && isCityValid && !isCityEmpty;
    canAddFavorite = canAddFavorite && !favorites.includes(cityLower) && favorites.length < 5;
    dom.favBtn.disabled = !canAddFavorite;
    if (!canAddFavorite && favorites.length >= 5) dom.favBtn.title = "Limite de 5 cidades favoritas atingido.";
    else if (!canAddFavorite && favorites.includes(cityLower)) dom.favBtn.title = `"${capitalizeCityName(city)}" já está nos favoritos.`;
    else dom.favBtn.title = "";
  },

  init() {
    showSpinner();
    dom.weatherContent.style.visibility = "hidden";
    dom.iconEl.style.visibility = "hidden";

    UI.applySavedTheme();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateButtonsState();

    const searchForm = document.getElementById("search-box");
    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      const city = normalizeCityInput(dom.cityInput.value);
      if (!UI.isValidCityInput(city)) {
        UI.showToast("Por favor, informe uma cidade válida (letras, espaços, hífens e apóstrofos).");
        dom.cityInput.focus();
        return;
      }
      this.handleCitySelect(city);
    });

    dom.cityInput.addEventListener("click", () => {
      dom.cityInput.value = "";
      currentCityValid = false;
      this.updateButtonsState();
    });

    dom.cityInput.addEventListener("input", () => {
      currentCityValid = false;
      this.updateButtonsState();
    });

    dom.favBtn.addEventListener("click", () => {
      const city = normalizeCityInput(dom.cityInput.value);
      if (!city) return;
      this.addFavorite(city);
    });

    dom.themeToggle.addEventListener("click", () => UI.toggleThemeColors());

    const lastCity = Storage.getLastCity();
    if (lastCity) {
      this.handleCitySelect(lastCity);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => this.fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        () => {
          UI.showError("Não foi possível obter sua localização. Exibindo clima para São Miguel do Oeste.");
          this.handleCitySelect("São Miguel do Oeste");
        }
      );
    } else {
      this.handleCitySelect("São Miguel do Oeste");
    }
  }
};

function showConfirmationModal(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    const desc = document.getElementById("confirm-modal-desc");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");

    desc.textContent = message;
    modal.hidden = false;
    modal.focus();

    function cleanUp() {
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
    }

    function onYes() { cleanUp(); modal.hidden = true; resolve(true); }
    function onNo() { cleanUp(); modal.hidden = true; resolve(false); }

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}

window.onload = () => App.init();
