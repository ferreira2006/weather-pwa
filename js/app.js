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

  stateSelect: document.getElementById("state-select"),
  citySelect: document.getElementById("city-select"),
  stateCitySearchBtn: document.getElementById("state-city-search-btn"),

  scrollTopBtn: document.getElementById("scroll-top-btn")
};

// ===== STATE =====
let currentCityValid = false;
let firstLoad = true;
let currentCity = "";

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
  isValidCityInput(city) { return city && Utils.validCityRegex.test(Utils.normalizeCityInput(city)); },

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
    currentCity = data.name;
    firstLoad = false;
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
    this.setDynamicBackgroundFromCurrentIcon();
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    document.body.classList.add(saved);
    document.body.classList.remove(saved === "dark" ? "light" : "dark");
    this.setDynamicBackgroundFromCurrentIcon();
  },

  setDynamicBackgroundFromCurrentIcon() {
    const mainClass = [...dom.iconEl.classList].find(c => c !== "weather-icon");
    this.setDynamicBackground(mainClass || "clear");
  }
};

// ===== FAVORITE ICON =====
const favIcon = document.createElement("img");
favIcon.id = "weather-fav-icon";
favIcon.src = "assets/icons/heart.svg";
favIcon.alt = "Favorito";
favIcon.classList.add("not-favorited");
dom.favBtn.prepend(favIcon);

// ===== APP =====
const App = {
  async handleCitySelect(city) {
    const normalizedCity = Utils.normalizeCityInput(city);
    if (!normalizedCity || (normalizedCity === currentCity && currentCityValid)) return;
    dom.weatherDiv.classList.add("loading");
    try {
      const data = await WeatherAPI.fetchByCity(normalizedCity);
      UI.showWeather(data);
      Storage.saveHistory(normalizedCity);
      UI.renderHistory();
      Storage.saveLastCity(normalizedCity);
      this.updateButtonsState();
      this.updateFavButton();
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
      this.updateFavButton();
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

    // animação do coração
    favIcon.classList.remove("favorited");
    void favIcon.offsetWidth; // reinicia animação
    favIcon.classList.add("favorited");

    this.updateFavButton();
  },

  async removeFavorite(city) {
    const confirmed = await showConfirmationModal(`Tem certeza que deseja remover "${city}" dos favoritos?`);
    if (!confirmed) return;
    const favorites = Storage.getFavorites().filter(c => c.toLowerCase() !== city.toLowerCase());
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${city}" removido dos favoritos.`);
    this.updateButtonsState();
    this.updateFavButton();
  },

  updateButtonsState() {
    const favorites = Storage.getFavorites().map(c => c.toLowerCase());
    const canAddFavorite = currentCityValid && currentCity && !favorites.includes(currentCity.toLowerCase()) && favorites.length < 5;
    dom.favBtn.disabled = !canAddFavorite;
  },

  updateFavButton() {
    const favorites = Storage.getFavorites().map(c => c.toLowerCase());
    if (favorites.includes(currentCity.toLowerCase())) {
      favIcon.classList.add("favorited");
      favIcon.classList.remove("not-favorited");
    } else {
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

    dom.favBtn.addEventListener("click", () => this.addFavorite(currentCity));
    dom.themeToggle.addEventListener("click", () => UI.toggleThemeColors());

    // Inicializa IBGE selects
    IBGE.init();

    // Scroll top
    window.addEventListener("scroll", () => {
      dom.scrollTopBtn.style.display = window.scrollY > 150 ? "block" : "none";
    });
    dom.scrollTopBtn.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));

    const lastCity = Storage.getLastCity();
    if (lastCity) this.handleCitySelect(lastCity);
    else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => this.fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        () => this.handleCitySelect("São Miguel do Oeste"));
    } else {
      this.handleCitySelect("São Miguel do Oeste");
    }
  }
};

// ===== CONFIRM MODAL =====
function showConfirmationModal(message) {
  return new Promise(resolve => {
    const modal = document.getElementById("confirm-modal");
    modal.querySelector("p").textContent = message;
    modal.removeAttribute("hidden");

    const yesBtn = modal.querySelector("#confirm-yes");
    const noBtn = modal.querySelector("#confirm-no");

    const cleanup = () => {
      yesBtn.removeEventListener("click", yesHandler);
      noBtn.removeEventListener("click", noHandler);
      modal.setAttribute("hidden", "");
    };

    const yesHandler = () => { cleanup(); resolve(true); };
    const noHandler = () => { cleanup(); resolve(false); };

    yesBtn.addEventListener("click", yesHandler);
    noBtn.addEventListener("click", noHandler);
  });
}

// ===== IBGE SELECTS =====
const IBGE = {
  async init() {
    try {
      const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
      const states = await res.json();
      states.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.nome;
        dom.stateSelect.appendChild(opt);
      });
      dom.stateSelect.addEventListener("change", () => this.onStateChange());
      dom.citySelect.addEventListener("change", () => this.updateSearchButtonState());
      dom.stateCitySearchBtn.addEventListener("click", () => this.onSearchClick());
      this.updateSearchButtonState();
    } catch {
      UI.showToast("Erro ao carregar estados do IBGE.");
    }
  },

  async onStateChange() {
    const stateId = dom.stateSelect.value;
    dom.citySelect.innerHTML = '<option value="">Selecione o município</option>';
    dom.citySelect.disabled = true;
    dom.stateCitySearchBtn.disabled = true;

    if (!stateId) return;

    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
      const cities = await res.json();
      cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city.nome;
        option.textContent = city.nome;
        dom.citySelect.appendChild(option);
      });
      dom.citySelect.disabled = false;
    } catch {
      UI.showToast("Erro ao carregar municípios do IBGE.");
    }
  },

  updateSearchButtonState() {
    dom.stateCitySearchBtn.disabled = !dom.citySelect.value;
  },

  onSearchClick() {
    const city = dom.citySelect.value;
    if (city) App.handleCitySelect(city);
  }
};

// ===== INIT APP =====
window.addEventListener("load", () => App.init());
