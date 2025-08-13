const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// Capitaliza cada palavra do nome da cidade
const capitalizeCityName = city =>
  city
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ');

// DOM
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
  getHistory: () => JSON.parse(localStorage.getItem("weatherHistory")) || [],
  saveHistory(city) {
    const formattedCity = capitalizeCityName(city);
    let history = this.getHistory().filter(c => c.toLowerCase() !== formattedCity.toLowerCase());
    history.unshift(formattedCity);
    localStorage.setItem("weatherHistory", JSON.stringify(history.slice(0, maxHistoryItems)));
  },

  getFavorites: () => JSON.parse(localStorage.getItem("weatherFavorites")) || [],
  saveFavorites(favorites) {
    localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
  },

  getTheme: () => localStorage.getItem("theme") || "light",
  saveTheme: theme => localStorage.setItem("theme", theme),

  getLastCity: () => localStorage.getItem("lastCity"),
  saveLastCity: city => localStorage.setItem("lastCity", city)
};

// ===== UI =====
const UI = {
  isValidCityInput(city) {
    if (!city) return false;
    return /^[a-zA-Zà-úÀ-ÚçÇ\s-]+$/.test(city.trim());
  },

  showToast(message, duration = 3000) {
    const t = dom.toast;
    t.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), duration);
    dom.cityInput.focus();
  },

  setBackground(weather) {
    const classes = ["bg-clear","bg-clouds","bg-rain","bg-thunderstorm","bg-snow"];
    document.body.classList.remove(...classes);
    weather = weather.toLowerCase();
    let key = "clear";
    if (weather.includes("cloud")) key="clouds";
    else if (weather.includes("rain")||weather.includes("drizzle")) key="rain";
    else if (weather.includes("thunderstorm")) key="thunderstorm";
    else if (weather.includes("snow")) key="snow";
    document.body.classList.add(`bg-${key}`);
  },

  showWeather(data) {
    document.body.classList.remove("error");
    dom.weatherError.hidden = true;
    dom.weatherContent.hidden = false;
    dom.iconEl.hidden = false;

    dom.cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    dom.descEl.textContent = data.weather[0].description;
    dom.detailsEl.innerHTML = `
      Sensação: ${Math.round(data.main.feels_like)}ºC<br/>
      Umidade: ${data.main.humidity}%<br/>
      Vento: ${data.wind.speed} m/s
    `;

    dom.iconEl.className = `weather-icon ${data.weather[0].main.toLowerCase()}`;
    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({behavior:"smooth",block:"start"});

    currentCityValid = true;
    App.updateButtonsState();
    this.setBackground(data.weather[0].main);
  },

  showError(message) {
    document.body.classList.add("error");
    dom.weatherError.textContent = message;
    dom.weatherError.hidden = false;
    dom.weatherContent.hidden = true;
    dom.iconEl.hidden = true;

    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({behavior:"smooth",block:"start"});

    currentCityValid = false;
    App.updateButtonsState();
  },

  toggleTheme() {
    const isDark = document.body.classList.toggle("dark");
    document.body.classList.toggle("light", !isDark);
    Storage.saveTheme(isDark ? "dark" : "light");
    this.setBackgroundFromIcon();
    UI.updateThemeToggleButton();
  },

  setBackgroundFromIcon() {
    if (!dom.weatherDiv.hidden) {
      const mainClass = [...dom.iconEl.classList].find(c => c!=="weather-icon") || "clear";
      this.setBackground(mainClass);
    } else {
      this.setBackground("clear");
    }
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    document.body.classList.toggle("dark", saved==="dark");
    document.body.classList.toggle("light", saved!=="dark");
    this.setBackgroundFromIcon();
    this.updateThemeToggleButton();
  },

  updateThemeToggleButton() {
    const isDark = document.body.classList.contains("dark");
    dom.themeToggle.textContent = isDark ? "Modo Claro" : "Modo Escuro";
    dom.themeToggle.setAttribute("aria-pressed", isDark);
  },

  renderHistory() {
    dom.historyListEl.innerHTML = "";
    Storage.getHistory().forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.textContent = city;
      li.setAttribute("aria-label", `Buscar clima da cidade ${city}`);
      li.addEventListener("click", () => App.handleCitySelect(city));
      li.addEventListener("keydown", e => (["Enter"," "].includes(e.key)) && (e.preventDefault(), App.handleCitySelect(city)));
      dom.historyListEl.appendChild(li);
    });
  },

  renderFavorites() {
    dom.favoritesListEl.innerHTML = "";
    Storage.getFavorites().forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.title = `Clique para buscar. Shift+Enter ou Delete para remover dos favoritos.`;
      const span = document.createElement("span");
      span.textContent = city;
      span.setAttribute("role","button");
      span.tabIndex = 0;
      span.addEventListener("click",()=>App.handleCitySelect(city));
      span.addEventListener("keydown", e => (["Enter"," "].includes(e.key)) && (e.preventDefault(), App.handleCitySelect(city)));
      const btn = document.createElement("button");
      btn.textContent = "×";
      btn.title = `Remover ${city} dos favoritos`;
      btn.addEventListener("click", e => (e.stopPropagation(), App.removeFavorite(city)));
      li.append(span, btn);
      li.addEventListener("keydown", e => (["Delete","Backspace"].includes(e.key) || (e.key==="Enter" && e.shiftKey)) && (e.preventDefault(), App.removeFavorite(city)));
      dom.favoritesListEl.appendChild(li);
    });
  }
};

// ===== APP =====
const App = {
  async handleCitySelect(city) {
    dom.weatherDiv.classList.add("loading");
    try {
      if (!city || (city.toLowerCase()===dom.cityInput.value.trim().toLowerCase() && currentCityValid)) return;
      dom.cityInput.value = city;
      const data = await WeatherAPI.fetchByCity(city);
      UI.showWeather(data);
      Storage.saveHistory(city);
      UI.renderHistory();
      Storage.saveLastCity(city);
      this.updateButtonsState();
    } catch (err) {
      UI.showError(err.message || "Erro ao buscar o clima");
    } finally { dom.weatherDiv.classList.remove("loading"); }
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
    } catch {
      UI.showError("Não foi possível obter o clima para sua localização.");
      await this.handleCitySelect("São Miguel do Oeste");
    } finally { dom.weatherDiv.classList.remove("loading"); }
  },

  addFavorite(city) {
    const formattedCity = capitalizeCityName(city);
    const favorites = Storage.getFavorites();
    if (favorites.includes(formattedCity)) return UI.showToast(`"${formattedCity}" já está nos favoritos.`);
    if (favorites.length >= 5) return UI.showToast("Limite de 5 cidades favoritas atingido.");
    Storage.saveFavorites([...favorites, formattedCity]);
    UI.renderFavorites();
    UI.showToast(`"${formattedCity}" adicionado aos favoritos!`);
    this.updateButtonsState();
  },

  async removeFavorite(city) {
    if (!await showConfirmationModal(`Remover "${city}" dos favoritos?`)) return;
    const favorites = Storage.getFavorites().filter(c=>c!==city);
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${city}" removido dos favoritos.`);
    this.updateButtonsState();
  },

  updateButtonsState() {
    const city = dom.cityInput.value.trim();
    const isValid = UI.isValidCityInput(city);
    const favorites = Storage.getFavorites();
    dom.searchBtn.disabled = !isValid;
    dom.favBtn.disabled = !isValid || !city || favorites.includes(capitalizeCityName(city)) || favorites.length>=5;
    dom.favBtn.title = favorites.length>=5 ? "Limite de 5 cidades favoritas atingido." : "";
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
      if (!UI.isValidCityInput(city)) return UI.showToast("Informe uma cidade válida.");
      this.handleCitySelect(city);
    });

    dom.cityInput.addEventListener("focus", () => {
      currentCityValid = false;
      this.updateButtonsState();
    });

    dom.cityInput.addEventListener("input", () => { currentCityValid=false; this.updateButtonsState(); });

    dom.favBtn.addEventListener("click", ()=>this.addFavorite(dom.cityInput.value.trim()));
    dom.themeToggle.addEventListener("click", ()=>UI.toggleTheme());

    const lastCity = Storage.getLastCity();
    if (lastCity) this.handleCitySelect(lastCity);
    else if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos=>this.fetchByCoords(pos.coords.latitude,pos.coords.longitude),()=>this.handleCitySelect("São Miguel do Oeste"));
    else this.handleCitySelect("São Miguel do Oeste");
  }
};

// ===== CONFIRM MODAL =====
function showConfirmationModal(message) {
  return new Promise(resolve=>{
    const modal = document.getElementById("confirm-modal");
    const desc = document.getElementById("confirm-modal-desc");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");

    desc.textContent = message;
    modal.hidden = false;
    modal.focus();

    const cleanUp = () => { yesBtn.removeEventListener("click",onYes); noBtn.removeEventListener("click",onNo); };
    const onYes = ()=>{ cleanUp(); modal.hidden=true; resolve(true); };
    const onNo = ()=>{ cleanUp(); modal.hidden=true; resolve(false); };

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}

// Inicializa
window.onload = () => App.init();
