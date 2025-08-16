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
  }
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

  favIcon: document.getElementById("fav-icon"),
  stateSelect: document.createElement("select"),
  citySelect: document.createElement("select"),
};

// ===== STATE =====
let currentCityValid = false;
let states = [];
let citiesByState = {};
let currentCity = "";

// ===== API =====
const WeatherAPI = {
  async fetchByCity(city) {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=1`);
    if (!res.ok) throw new Error("Cidade não encontrada");
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
      currentCity = e.target.value;
      App.updateButtonsState();
      App.updateFavIcon();
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
  saveFavorites(favs) { localStorage.setItem("weatherFavorites", JSON.stringify(favs)); },
  getTheme: () => localStorage.getItem("theme") || "light",
  saveTheme(theme) { localStorage.setItem("theme", theme); },
  getLastCity: () => localStorage.getItem("lastCity"),
  saveLastCity(city) { localStorage.setItem("lastCity", city); }
};

// ===== UI =====
const UI = {
  showToast(msg, duration=3000) {
    const t = dom.toast;
    t.textContent = msg;
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), duration);
  },
  showWeather(data) {
    dom.weatherError.style.display = "none";
    dom.weatherContent.style.display = "block";
    dom.iconEl.style.display = "block";

    dom.cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    dom.descEl.textContent = data.weather[0].description;
    dom.detailsEl.innerHTML = `Sensação: ${Math.round(data.main.feels_like)}ºC<br/>Umidade: ${data.main.humidity}%<br/>Vento: ${data.wind.speed} m/s`;

    dom.weatherDiv.hidden = false;

    currentCityValid = true;
    currentCity = data.name;
    App.updateButtonsState();
    App.updateFavIcon();
  },
  showError(msg) {
    dom.weatherError.textContent = msg;
    dom.weatherError.style.display = "block";
    dom.weatherContent.style.display = "none";
    dom.iconEl.style.display = "none";
    currentCityValid = false;
    App.updateButtonsState();
    App.updateFavIcon();
  },
  renderList(listEl, items, clickCallback) {
    listEl.innerHTML = "";
    items.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.textContent = city;
      if (clickCallback) li.addEventListener("click", () => clickCallback(city));
      listEl.appendChild(li);
    });
  },
  renderHistory() { this.renderList(dom.historyListEl, Storage.getHistory(), city => App.handleCitySelect(city)); },
  renderFavorites() { 
    const favs = Storage.getFavorites();
    dom.favoritesListEl.innerHTML = "";
    favs.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.textContent = city;
      li.addEventListener("click", () => App.handleCitySelect(city));
      dom.favoritesListEl.appendChild(li);
    });
  },
  applySavedTheme() {
    const t = Storage.getTheme();
    document.body.classList.add(t);
    dom.themeToggle.setAttribute("aria-pressed", t === "dark");
  }
};

// ===== APP =====
const App = {
  async handleCitySelect(city) {
    if (!city) return;
    dom.weatherDiv.classList.add("loading");
    try {
      const data = await WeatherAPI.fetchByCity(city);
      UI.showWeather(data);
      Storage.saveHistory(city);
      UI.renderHistory();
      Storage.saveLastCity(city);
    } catch(err) { UI.showError(err.message); }
    finally { dom.weatherDiv.classList.remove("loading"); }
  },
  addFavorite(city) {
    if (!city) return;
    const favs = Storage.getFavorites();
    const fCity = Utils.capitalizeCityName(city);
    if (favs.includes(fCity)) {
      UI.showToast(`${fCity} já está nos favoritos`);
      return;
    }
    if (favs.length >=5) { UI.showToast("Limite de 5 cidades favoritas"); return; }
    favs.push(fCity);
    Storage.saveFavorites(favs);
    UI.renderFavorites();
    UI.showToast(`${fCity} adicionado aos favoritos!`);
    App.updateFavIcon();
  },
  updateButtonsState() {
    const favs = Storage.getFavorites();
    dom.searchBtn.disabled = !currentCityValid;
    dom.favBtn.disabled = !currentCityValid || favs.includes(currentCity) || favs.length>=5;
  },
  updateFavIcon() {
    const favs = Storage.getFavorites();
    if (!currentCityValid || !currentCity) {
      dom.favIcon.classList.remove("favorited");
      dom.favIcon.classList.add("not-favorited");
      dom.favIcon.textContent = "🤍";
      return;
    }
    if (favs.includes(currentCity)) {
      dom.favIcon.classList.add("favorited");
      dom.favIcon.classList.remove("not-favorited");
      dom.favIcon.textContent = "❤️";
    } else {
      dom.favIcon.classList.remove("favorited");
      dom.favIcon.classList.add("not-favorited");
      dom.favIcon.textContent = "🤍";
    }
  },
  init() {
    UI.applySavedTheme();
    UI.renderHistory();
    UI.renderFavorites();
    IBGE.fetchStates();
    this.updateButtonsState();
    this.updateFavIcon();

    document.getElementById("search-box").addEventListener("submit", e=>{
      e.preventDefault();
      if (!currentCityValid) return UI.showToast("Selecione uma cidade válida.");
      this.handleCitySelect(currentCity);
    });

    dom.favBtn.addEventListener("click", ()=>{ this.addFavorite(currentCity); });

    dom.themeToggle.addEventListener("click", ()=>{
      document.body.classList.toggle("dark");
      document.body.classList.toggle("light");
      const isDark = document.body.classList.contains("dark");
      Storage.saveTheme(isDark ? "dark" : "light");
      dom.themeToggle.setAttribute("aria-pressed", isDark);
    });

    const lastCity = Storage.getLastCity();
    if(lastCity) this.handleCitySelect(lastCity);
  }
};

window.onload = () => App.init();

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
    const clean = ()=>{ yesBtn.removeEventListener("click",onYes); noBtn.removeEventListener("click",onNo); };
    const onYes = ()=>{ clean(); modal.hidden=true; resolve(true); };
    const onNo = ()=>{ clean(); modal.hidden=true; resolve(false); };
    yesBtn.addEventListener("click",onYes);
    noBtn.addEventListener("click",onNo);
  });
}
