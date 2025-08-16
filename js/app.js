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
let currentCityValid = false; // habilita busca
let currentCityLoaded = false; // habilita favoritos
let states = [];
let citiesByState = {};
let currentCity = "";
let citiesWithData = {}; // { "Cidade": true } para marcar cidades que já carregaram dados

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
      currentCity = e.target.value;
      currentCityValid = !!currentCity;
      currentCityLoaded = !!citiesWithData[currentCity]; 
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

  updateBackground(weatherMain) {
    document.body.classList.remove('bg-clear','bg-clouds','bg-rain','bg-thunderstorm','bg-snow');
    switch(weatherMain.toLowerCase()) {
      case 'clear': document.body.classList.add('bg-clear'); break;
      case 'clouds': document.body.classList.add('bg-clouds'); break;
      case 'rain': document.body.classList.add('bg-rain'); break;
      case 'thunderstorm': document.body.classList.add('bg-thunderstorm'); break;
      case 'snow': document.body.classList.add('bg-snow'); break;
      default: document.body.classList.add('bg-clear');
    }
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

    currentCityLoaded = true;
    citiesWithData[data.name] = true;
    currentCity = data.name;

    UI.updateBackground(data.weather[0].main);
    App.updateButtonsState();
    App.updateFavIcon();
    UI.renderHistory();
    UI.renderFavorites();
  },

  showError(msg) {
    document.body.classList.add("error");
    dom.weatherError.textContent = msg;
    dom.weatherError.style.display = "block";
    dom.weatherContent.style.display = "none";
    dom.iconEl.style.display = "none";
    currentCityValid = false;
    currentCityLoaded = false;
    App.updateButtonsState();
    App.updateFavIcon();
  },

  renderList(listEl, items, clickCallback) {
    listEl.innerHTML = "";
    items.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;

      // Adiciona cadeado se a cidade não tiver dados
      const hasData = !!citiesWithData[city];
      li.textContent = city + (hasData ? "" : " 🔒");

      if (clickCallback) li.addEventListener("click", () => {
        currentCityLoaded = !!citiesWithData[city]; 
        clickCallback(city);
      });

      if(city === currentCity) li.classList.add("selected");
      listEl.appendChild(li);
    });
  },

  renderHistory() { 
    this.renderList(dom.historyListEl, Storage.getHistory(), city => App.handleCitySelect(city)); 
  },

  renderFavorites() { 
    const favs = Storage.getFavorites();
    dom.favoritesListEl.innerHTML = "";
    favs.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.textContent = city;

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-fav";
      removeBtn.textContent = "✕";
      removeBtn.setAttribute("aria-label", `Remover ${city} dos favoritos`);
      removeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const confirm = await showConfirmationModal(`Remover ${city} dos favoritos?`);
        if (!confirm) return;
        const newFavs = Storage.getFavorites().filter(f => f !== city);
        Storage.saveFavorites(newFavs);
        UI.renderFavorites();
        App.updateButtonsState();
        App.updateFavIcon();
      });
      li.appendChild(removeBtn);

      li.addEventListener("click", () => App.handleCitySelect(city));
      if(city === currentCity) li.classList.add("selected");
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
      Storage.saveLastCity(city);
    } catch(err) { 
      // Mantém a cidade no histórico mesmo sem dados
      citiesWithData[city] = false;
      Storage.saveHistory(city);
      UI.renderHistory();
      UI.showError(err.message); 
    } finally { 
      dom.weatherDiv.classList.remove("loading"); 
    }
  },

  addFavorite(city) {
    if (!city || !currentCityLoaded) return;
    const favs = Storage.getFavorites();
    const fCity = Utils.capitalizeCityName(city);
    if (favs.includes(fCity)) {
      UI.showToast(`${fCity} já está nos favoritos`);
      return;
    }
    if (favs.length >= 5) { 
      UI.showToast("Limite de 5 cidades favoritas"); 
      return; 
    }
    favs.push(fCity);
    Storage.saveFavorites(favs);
    UI.renderFavorites();
    UI.showToast(`${fCity} adicionado aos favoritos!`);
    this.updateFavIcon();
    this.updateButtonsState();
  },

  updateButtonsState() {
    const favs = Storage.getFavorites();
    const history = Storage.getHistory();
    const isFav = favs.includes(currentCity);
    const isRecent = history.includes(currentCity);

    dom.searchBtn.disabled = !currentCityValid || isFav || isRecent;

    const canAddFav = currentCityValid && currentCityLoaded && !isFav && !isRecent && favs.length < 5;
    dom.favBtn.disabled = !canAddFav;
  },

  updateFavIcon() {
    const favs = Storage.getFavorites();
    if (!currentCityLoaded || !currentCity) {
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
    IBGE.fetchStates();
    this.updateButtonsState();
    this.updateFavIcon();

    dom.searchBtn.addEventListener("click", ()=>{
      if (!currentCityValid || !currentCity) return UI.showToast("Selecione uma cidade válida.");
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
    if (lastCity) {
      currentCity = lastCity;
      currentCityValid = true;
      currentCityLoaded = !!citiesWithData[lastCity];
      this.handleCitySelect(lastCity);
    } else {
      initGeolocation();
    }
  }
};

// ===== SPINNER + GEO =====
function initGeolocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => App.handleCitySelect(`${pos.coords.latitude},${pos.coords.longitude}`),
      err => { 
        UI.showToast("Não foi possível obter localização. Selecionando cidade padrão."); 
        App.handleCitySelect("São Miguel do Oeste"); 
      },
      { timeout: 5000 }
    );
  } else {
    App.handleCitySelect("São Miguel do Oeste");
  }
}

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

window.onload = () => App.init();
