// URL do backend e limite de histórico
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather"; // endpoint da API de clima
const maxHistoryItems = 5; // máximo de cidades no histórico

// ===== UTILS ======
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  },

  normalizeCityInput(city) {
    return city ? city.replace(/[’‘]/g, "'").trim().replace(/\s+/g, " ") : "";
  },

  validCityRegex: /^[\p{L}\s'-]+$/u
};

// ===== DOM ELEMENTS ======
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

// ===== STATE ======
let currentCityValid = false;
let firstLoad = true;

// ===== API ======
const WeatherAPI = {
  async fetchByCity(city) {
    try {
      const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=1`);
      if (!res.ok) throw new Error("Cidade não encontrada");
      return res.json();
    } catch (err) {
      if (err instanceof TypeError) throw new Error("Erro de conexão. Verifique sua internet.");
      else throw err;
    }
  },

  async fetchByCoords(lat, lon) {
    try {
      const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}&days=1`);
      if (!res.ok) throw new Error("Não foi possível obter o clima para sua localização.");
      return res.json();
    } catch (err) {
      if (err instanceof TypeError) throw new Error("Erro de conexão. Verifique sua internet.");
      else throw err;
    }
  }
};

// ===== STORAGE ======
const Storage = {
  getHistory: () => JSON.parse(localStorage.getItem("weatherHistory")) || [],

  saveHistory(city) {
    const formattedCity = Utils.capitalizeCityName(city);
    let history = this.getHistory().filter(c => c.toLowerCase() !== formattedCity.toLowerCase());
    history.unshift(formattedCity);
    localStorage.setItem("weatherHistory", JSON.stringify(history.slice(0, maxHistoryItems)));
  },

  getFavorites: () => JSON.parse(localStorage.getItem("weatherFavorites")) || [],
  saveFavorites(favorites) { localStorage.setItem("weatherFavorites", JSON.stringify(favorites)); },

  getTheme: () => localStorage.getItem("theme") || "light",
  saveTheme: theme => localStorage.setItem("theme", theme),

  getLastCity: () => localStorage.getItem("lastCity"),
  saveLastCity: city => localStorage.setItem("lastCity", city)
};

// ===== UI ======
const UI = {
  isValidCityInput(city) {
    return city && Utils.validCityRegex.test(Utils.normalizeCityInput(city));
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

  setDynamicBackground(weather) {
    weather = weather.toLowerCase();
    let key;

    if (weather.includes("scattered clouds")) key = "scattered-clouds";
    else if (weather.includes("fog") || weather.includes("mist") || weather.includes("haze")) key = "fog";
    else if (weather.includes("cloud")) key = "clouds";
    else if (weather.includes("rain") || weather.includes("drizzle")) key = "rain";
    else if (weather.includes("thunderstorm")) key = "thunderstorm";
    else if (weather.includes("snow")) key = "snow";
    else key = "clear";

    // Atualiza dataset do body em vez de classes
    document.body.dataset.clima = key;
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

    const mainWeather = data.weather[0].main.toLowerCase();
    let iconClass;
    if (mainWeather.includes("scattered clouds")) iconClass = "scattered-clouds";
    else if (mainWeather.includes("fog") || mainWeather.includes("mist") || mainWeather.includes("haze")) iconClass = "fog";
    else iconClass = mainWeather;

    dom.iconEl.className = `weather-icon ${iconClass}`;

    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    currentCityValid = true;
    firstLoad = false;
    App.updateButtonsState();
    this.setDynamicBackground(data.weather[0].description);
  },

  showError(message) {
    document.body.classList.add("error");
    dom.weatherError.textContent = message;
    dom.weatherError.style.display = "block";
    dom.weatherContent.style.display = "none";
    dom.iconEl.style.display = "none";
    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    currentCityValid = false;
    App.updateButtonsState();
  },

  renderList(listEl, items, clickCallback, removeCallback) {
    listEl.innerHTML = "";
    items.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.title = clickCallback ? `Clique para buscar.` : "";
      li.textContent = city;
      if (clickCallback) li.addEventListener("click", () => clickCallback(city));
      if (removeCallback) li.addEventListener("keydown", e => {
        if (["Delete","Backspace"].includes(e.key) || (e.key === "Enter" && e.shiftKey)) removeCallback(city);
      });
      listEl.appendChild(li);
    });
    this.updateThemeColors();
  },

  renderHistory() {
    this.renderList(dom.historyListEl, Storage.getHistory(), city => App.handleCitySelect(city));
  },

  renderFavorites() {
    dom.favoritesListEl.innerHTML = "";
    Storage.getFavorites().forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.title = "Clique para buscar. Pressione Shift+Enter ou Delete para remover dos favoritos.";

      const citySpan = document.createElement("span");
      citySpan.textContent = city;
      citySpan.style.cursor = "pointer";
      citySpan.addEventListener("click", () => App.handleCitySelect(city));
      li.appendChild(citySpan);

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      Object.assign(removeBtn.style, { marginLeft:"8px", cursor:"pointer", background:"transparent", border:"none", fontWeight:"bold", fontSize:"1.2rem", lineHeight:"1", padding:"0" });
      removeBtn.addEventListener("click", e => { e.stopPropagation(); App.removeFavorite(city); });
      li.appendChild(removeBtn);

      dom.favoritesListEl.appendChild(li);
    });
    this.updateThemeColors();
  },

  toggleThemeColors() {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
    Storage.saveTheme(document.body.classList.contains("dark") ? "dark" : "light");
    this.updateThemeColors();
    this.updateThemeToggleButton();
    this.setDynamicBackgroundFromCurrentIcon();
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    document.body.classList.add(saved);
    document.body.classList.remove(saved === "dark" ? "light" : "dark");
    this.updateThemeColors();
    this.updateThemeToggleButton();
    this.setDynamicBackgroundFromCurrentIcon();
  },

  updateThemeToggleButton() {
    const isDark = document.body.classList.contains("dark");
    dom.themeToggle.textContent = isDark ? "Modo Claro" : "Modo Escuro";
    dom.themeToggle.setAttribute("aria-pressed", isDark);
  },

  updateThemeColors() {
    const root = getComputedStyle(document.documentElement);
    const isDark = document.body.classList.contains("dark");
    const textColor = isDark ? root.getPropertyValue('--input-text-dark').trim() : root.getPropertyValue('--input-text-light').trim();
    const bgColor = isDark ? root.getPropertyValue('--input-bg-dark').trim() : root.getPropertyValue('--input-bg-light').trim();
    const buttonBg = root.getPropertyValue('--button-bg').trim();

    dom.cityInput.style.color = textColor;
    dom.cityInput.style.backgroundColor = bgColor;

    [dom.searchBtn, dom.favBtn].forEach(btn => { btn.style.backgroundColor = buttonBg; btn.style.color = isDark ? '#ddd' : '#fff'; });
    [...dom.historyListEl.children, ...dom.favoritesListEl.children].forEach(li => { li.style.backgroundColor = buttonBg; li.style.color = isDark ? '#ddd' : '#fff'; });

    dom.detailsEl.style.color = isDark ? '#ddd' : '#000';
    dom.weatherError.style.color = isDark ? '#ffbaba' : '#b00000';
    dom.weatherError.style.backgroundColor = isDark ? '#5c0000' : '#ffdede';
    dom.themeToggle.style.color = isDark ? '#ddd' : '#000';
    dom.themeToggle.style.borderColor = isDark ? '#ddd' : '#000';
  },

  setDynamicBackgroundFromCurrentIcon() {
    const mainClass = [...dom.iconEl.classList].find(c => c !== "weather-icon");
    this.setDynamicBackground(mainClass || "clear");
  }
};

// ===== FAVORITE ICON =====
const favIcon = document.createElement("span");
favIcon.id = "fav-icon";
favIcon.classList.add("not-favorited");
favIcon.textContent = "🤍";
dom.favBtn.prepend(favIcon);

// ===== APP ======
const App = {
  async handleCitySelect(city) {
    const normalizedCity = Utils.normalizeCityInput(city);
    if (!normalizedCity || (normalizedCity.toLowerCase() === dom.cityInput.value.trim().toLowerCase() && currentCityValid)) return;

    dom.weatherDiv.classList.add("loading");
    try {
      dom.cityInput.value = normalizedCity;
      const data = await WeatherAPI.fetchByCity(normalizedCity);
      UI.showWeather(data);
      Storage.saveHistory(normalizedCity);
      UI.renderHistory();
      Storage.saveLastCity(normalizedCity);
      this.updateButtonsState();
    } catch (err) { UI.showError(err.message || "Erro ao buscar o clima"); }
    finally { dom.weatherDiv.classList.remove("loading"); }
  },

  async fetchByCoords(lat, lon) {
    dom.weatherDiv.classList.add("loading");
    try {
      const data = await WeatherAPI.fetchByCoords(lat, lon);
      UI.showWeather(data);
      Storage.saveHistory(data.name);
      UI.renderHistory();
      Storage.saveLastCity(data.name);
      this.updateButtonsState();
    } catch (err) {
      UI.showError(err.message);
      if (!Storage.getLastCity()) await this.handleCitySelect("São Miguel do Oeste");
    } finally { dom.weatherDiv.classList.remove("loading"); }
  },

  addFavorite(city) {
    const formattedCity = Utils.capitalizeCityName(Utils.normalizeCityInput(city));
    const favorites = Storage.getFavorites();
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
    const favorites = Storage.getFavorites().filter(c => c.toLowerCase() !== city.toLowerCase());
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${city}" removido dos favoritos.`);
    this.updateButtonsState();
  },

  updateButtonsState() {
    const city = Utils.normalizeCityInput(dom.cityInput.value);
    const favorites = Storage.getFavorites().map(c => c.toLowerCase());
    const canAddFavorite = currentCityValid && city && UI.isValidCityInput(city) && !favorites.includes(city.toLowerCase()) && favorites.length < 5;

    dom.searchBtn.disabled = !UI.isValidCityInput(city);
     dom.favBtn.disabled = !canAddFavorite;
    dom.favBtn.title = !canAddFavorite
      ? favorites.includes(city.toLowerCase()) 
        ? `"${Utils.capitalizeCityName(city)}" já está nos favoritos.` 
        : "Limite de 5 cidades favoritas atingido."
      : "";

    // Atualiza ícone favorito visual
    if (favorites.includes(city.toLowerCase())) {
      favIcon.textContent = "❤️";
      favIcon.classList.add("favorited");
      favIcon.classList.remove("not-favorited");
    } else {
      favIcon.textContent = "🤍";
      favIcon.classList.remove("favorited");
      favIcon.classList.add("not-favorited");
    }
  },

  init() {
    dom.weatherDiv.classList.add("loading");
    UI.applySavedTheme();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateButtonsState();

    // Form submit
    document.getElementById("search-box").addEventListener("submit", e => {
      e.preventDefault();
      const city = Utils.normalizeCityInput(dom.cityInput.value);
      if (!UI.isValidCityInput(city)) return UI.showToast("Informe uma cidade válida."); 
      this.handleCitySelect(city);
    });

    dom.cityInput.addEventListener("input", () => { currentCityValid = false; this.updateButtonsState(); });
    dom.cityInput.addEventListener("click", () => { dom.cityInput.value = ""; currentCityValid = false; this.updateButtonsState(); });
    dom.favBtn.addEventListener("click", () => { const city = Utils.normalizeCityInput(dom.cityInput.value); if (city) this.addFavorite(city); });
    dom.themeToggle.addEventListener("click", () => UI.toggleThemeColors());

    const lastCity = Storage.getLastCity();
    if (lastCity) this.handleCitySelect(lastCity);
    else if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      pos => this.fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => { UI.showError("Não foi possível obter sua localização."); this.handleCitySelect("São Miguel do Oeste"); }
    );
    else this.handleCitySelect("São Miguel do Oeste"); // fallback default
  }
};

// ===== MODAL =====
function showConfirmationModal(message) {
  return new Promise(resolve => {
    const modal = document.getElementById("confirm-modal");
    const desc = document.getElementById("confirm-modal-desc");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");

    desc.textContent = message;
    modal.hidden = false;
    modal.focus();

    const cleanUp = () => { yesBtn.removeEventListener("click", onYes); noBtn.removeEventListener("click", onNo); };
    const onYes = () => { cleanUp(); modal.hidden = true; resolve(true); };
    const onNo = () => { cleanUp(); modal.hidden = true; resolve(false); };

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}

// ===== INICIALIZAÇÃO =====
window.onload = () => App.init();
