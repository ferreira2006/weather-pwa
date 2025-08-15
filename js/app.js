const backendUrl = "https://weather-backend-hh3w.onrender.com/weather"; 
const maxHistoryItems = 5;

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

// ===== DOM ELEMENTS =====
const dom = {
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

  stateSelect: document.createElement("select"),
  citySelect: document.createElement("select"),
};

// ===== STATE =====
let currentCityValid = false;
let states = [];
let citiesByState = {};

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

// ===== IBGE =====
const IBGE = {
  async fetchStates() {
    const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
    if (!res.ok) throw new Error("Não foi possível carregar os estados");
    states = await res.json();
    states.sort((a,b) => a.nome.localeCompare(b.nome));
    IBGE.populateStateSelect();
  },
  populateStateSelect() {
    dom.stateSelect.id = "state-select";
    dom.stateSelect.innerHTML = `<option value="">Selecione o estado</option>` + 
      states.map(s => `<option value="${s.id}">${s.nome}</option>`).join("");
    dom.stateSelect.addEventListener("change", IBGE.onStateChange);
    const searchBox = document.getElementById("search-box");
    searchBox.insertBefore(dom.stateSelect, dom.searchBtn);
  },
  async onStateChange(e) {
    const stateId = e.target.value;
    if (!stateId) {
      dom.citySelect.innerHTML = `<option value="">Selecione a cidade</option>`;
      dom.citySelect.disabled = true;
      currentCityValid = false;
      App.updateButtonsState();
      return;
    }
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
    if (!res.ok) throw new Error("Não foi possível carregar as cidades");
    const cities = await res.json();
    citiesByState[stateId] = cities;
    IBGE.populateCitySelect(cities);
  },
  populateCitySelect(cities) {
    dom.citySelect.id = "city-select";
    dom.citySelect.disabled = false;
    dom.citySelect.innerHTML = `<option value="">Selecione a cidade</option>` + 
      cities.map(c => `<option value="${c.nome}">${c.nome}</option>`).join("");
    dom.citySelect.addEventListener("change", e => {
      currentCityValid = !!e.target.value;
      App.updateButtonsState();
    });
    const searchBox = document.getElementById("search-box");
    searchBox.insertBefore(dom.citySelect, dom.searchBtn);
  }
};

// ===== STORAGE =====
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

// ===== UI =====
const UI = {
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
    const classes = ["bg-clear", "bg-clouds", "bg-rain", "bg-thunderstorm", "bg-snow"];
    document.body.classList.remove(...classes);
    weather = weather.toLowerCase();
    let key = weather.includes("cloud") ? "clouds" :
              (weather.includes("rain") || weather.includes("drizzle")) ? "rain" :
              weather.includes("thunderstorm") ? "thunderstorm" :
              weather.includes("snow") ? "snow" : "clear";
    document.body.classList.add(`bg-${key}`);
  },

  showWeather(data) {
    document.body.classList.remove("error");
    dom.weatherError.style.display = "none";
    dom.weatherError.style.opacity = 0;
    dom.weatherContent.style.display = "block";
    dom.iconEl.style.display = "block";

    dom.cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    dom.descEl.textContent = data.weather[0].description;
    dom.detailsEl.innerHTML = `Sensação: ${Math.round(data.main.feels_like)}ºC<br/>Umidade: ${data.main.humidity}%<br/>Vento: ${data.wind.speed} m/s`;

    dom.iconEl.className = `weather-icon ${data.weather[0].main.toLowerCase()}`;

    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    currentCityValid = true;
    App.updateButtonsState();
    this.setDynamicBackground(data.weather[0].main);
  },

  showError(message) {
    document.body.classList.add("error");
    dom.weatherError.textContent = message;
    dom.weatherError.style.display = "block";
    dom.weatherError.style.opacity = "1";
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
  },

  renderHistory() { this.renderList(dom.historyListEl, Storage.getHistory(), city => App.handleCitySelect(city)); },

  renderFavorites() {
    dom.favoritesListEl.innerHTML = "";
    Storage.getFavorites().forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.title = "Clique para buscar. Pressione Shift+Enter ou Delete para remover dos favoritos.";

      const citySpan = document.createElement("span");
      citySpan.textContent = city;
      Object.assign(citySpan.style, { cursor: "pointer" });
      citySpan.addEventListener("click", () => App.handleCitySelect(city));
      li.appendChild(citySpan);

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      Object.assign(removeBtn.style, { marginLeft:"8px", cursor:"pointer", background:"transparent", border:"none", fontWeight:"bold", fontSize:"1.2rem", lineHeight:"1", padding:"0" });
      removeBtn.addEventListener("click", e => { e.stopPropagation(); App.removeFavorite(city); });
      li.appendChild(removeBtn);

      dom.favoritesListEl.appendChild(li);
    });
  },

  toggleThemeColors() {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
    Storage.saveTheme(document.body.classList.contains("dark") ? "dark" : "light");
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    document.body.classList.add(saved);
    document.body.classList.remove(saved === "dark" ? "light" : "dark");
  }
};

// ===== FAVORITE ICON =====
const favIcon = document.getElementById("fav-icon");

// ===== APP =====
const App = {
  async handleCitySelect(city) {
    const normalizedCity = Utils.normalizeCityInput(city);
    if (!normalizedCity) return;
    dom.weatherDiv.classList.add("loading");
    try {
      const data = await WeatherAPI.fetchByCity(normalizedCity);
      UI.showWeather(data);
      Storage.saveHistory(normalizedCity);
      UI.renderHistory();
      Storage.saveLastCity(normalizedCity);
    } catch (err) { UI.showError(err.message || "Erro ao buscar o clima"); }
    finally { dom.weatherDiv.classList.remove("loading"); }
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
  },

  async removeFavorite(city) {
    const confirmed = await showConfirmationModal(`Tem certeza que deseja remover "${city}" dos favoritos?`);
    if (!confirmed) return;
    const favorites = Storage.getFavorites().filter(c => c.toLowerCase() !== city.toLowerCase());
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${city}" removido dos favoritos.`);
  },

  updateButtonsState() {
    const city = dom.citySelect.value.trim();
    const favorites = Storage.getFavorites().map(c => c.toLowerCase());
    const canAddFavorite = currentCityValid && city && !favorites.includes(city.toLowerCase()) && favorites.length < 5;

    dom.searchBtn.disabled = !currentCityValid;
    dom.favBtn.disabled = !canAddFavorite;
  },

  init() {
    dom.weatherDiv.classList.add("loading");
    UI.applySavedTheme();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateButtonsState();

    IBGE.fetchStates();

    document.getElementById("search-box").addEventListener("submit", e => {
      e.preventDefault();
      const city = dom.citySelect.value;
      if (!city) return UI.showToast("Selecione uma cidade válida."); 
      this.handleCitySelect(city);
    });

    dom.favBtn.addEventListener("click", () => {
      const city = dom.citySelect.value;
      if (city) this.addFavorite(city);
    });

    dom.themeToggle.addEventListener("click", () => UI.toggleThemeColors());

    const lastCity = Storage.getLastCity();
    if (lastCity) this.handleCitySelect(lastCity);
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

window.onload = () => App.init();
