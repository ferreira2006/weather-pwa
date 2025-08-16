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

  stateSelect: document.createElement("select"),
  citySelect: document.createElement("select"),
};

// ===== STATE =====
let currentCityValid = false;
let states = [];
let citiesByState = {};

// ===== THEME =====
function setTheme(theme) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);
  localStorage.setItem("theme", theme);
}

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

    // Atualiza ícone e background climático
    const condition = data.weather[0].main.toLowerCase();
    dom.iconEl.className = `weather-icon ${condition}`;
    document.body.classList.remove("bg-clear","bg-clouds","bg-rain","bg-thunderstorm","bg-snow");
    switch(condition){
      case "clear": document.body.classList.add("bg-clear"); break;
      case "clouds": document.body.classList.add("bg-clouds"); break;
      case "rain": case "drizzle": document.body.classList.add("bg-rain"); break;
      case "thunderstorm": document.body.classList.add("bg-thunderstorm"); break;
      case "snow": document.body.classList.add("bg-snow"); break;
      default: document.body.classList.add("bg-clear"); break;
    }

    dom.weatherDiv.hidden = false;
    currentCityValid = true;
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
  },
  renderList(listEl, items, clickCallback) {
    listEl.innerHTML = "";
    items.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.textContent = city;
      if (clickCallback) li.addEventListener("click", () => clickCallback(city));

      // Adiciona botão de remoção se for favorites-list
      if(listEl.id === "favorites-list"){
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-fav";
        removeBtn.textContent = "✖";
        removeBtn.onclick = async (e) => {
          e.stopPropagation();
          const confirm = await showConfirmationModal(`Deseja remover ${city} dos favoritos?`);
          if(confirm){
            App.removeFavorite(city);
          }
        };
        li.appendChild(removeBtn);
      }

      listEl.appendChild(li);
    });
  },
  renderHistory() { this.renderList(dom.historyListEl, Storage.getHistory(), city => App.handleCitySelect(city)); },
  renderFavorites() { 
    this.renderList(dom.favoritesListEl, Storage.getFavorites(), city => App.handleCitySelect(city));
  },
  applySavedTheme() { setTheme(Storage.getTheme()); }
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
    if (favs.includes(fCity)) { UI.showToast(`${fCity} já está nos favoritos`); return; }
    if (favs.length >=5) { UI.showToast("Limite de 5 cidades favoritas"); return; }
    favs.push(fCity);
    Storage.saveFavorites(favs);
    UI.renderFavorites();
    UI.showToast(`${fCity} adicionado aos favoritos!`);
    App.updateFavIcon();
  },
  removeFavorite(city) {
    let favs = Storage.getFavorites();
    favs = favs.filter(c => c.toLowerCase() !== city.toLowerCase());
    Storage.saveFavorites(favs);
    UI.renderFavorites();
    UI.showToast(`${city} removido dos favoritos.`);
    App.updateFavIcon();
    App.updateButtonsState();
  },
  updateButtonsState() {
    if(!dom.citySelect) return;
    const city = dom.citySelect.value;
    const favs = Storage.getFavorites();
    dom.searchBtn.disabled = !currentCityValid;
    dom.favBtn.disabled = !currentCityValid || favs.includes(city) || favs.length>=5;
  },
  updateFavIcon() {
    if(!dom.citySelect) return;
    const city = dom.citySelect.value;
    const favs = Storage.getFavorites();
    const icon = document.getElementById("fav-icon");
    if(favs.includes(city)) {
      icon.textContent = "❤️";
      icon.classList.add("favorited");
      icon.classList.remove("not-favorited");
    } else {
      icon.textContent = "🤍";
      icon.classList.add("not-favorited");
      icon.classList.remove("favorited");
    }
  },
  init() {
    UI.applySavedTheme();
    UI.renderHistory();
    UI.renderFavorites();
    IBGE.fetchStates();
    this.updateButtonsState();

    document.getElementById("search-box").addEventListener("submit", e=>{
      e.preventDefault();
      const city = dom.citySelect?.value;
      if (!city) return UI.showToast("Selecione uma cidade válida.");
      this.handleCitySelect(city);
    });

    dom.favBtn.addEventListener("click", ()=> {
      const city = dom.citySelect?.value;
      this.addFavorite(city);
    });

    dom.themeToggle.addEventListener("click", ()=>{
      const currentTheme = document.body.classList.contains("light") ? "light":"dark";
      const newTheme = currentTheme==="light"?"dark":"light";
      setTheme(newTheme);
      dom.themeToggle.textContent = newTheme==="light"?"Modo Escuro":"Modo Claro";
      dom.themeToggle.setAttribute("aria-pressed", newTheme==="dark");
    });

    const lastCity = Storage.getLastCity();
    if(lastCity) this.handleCitySelect(lastCity);
  }
};

// ===== MODAL =====
function showConfirmationModal(message) {
  return new Promise(resolve=>{
    const modal = document.getElementById("confirm-modal");
    modal.querySelector("#confirm-modal-desc").textContent = message;
    modal.hidden = false;

    const yesBtn = modal.querySelector("#confirm-yes");
    const noBtn = modal.querySelector("#confirm-no");

    function cleanup() {
      modal.hidden = true;
      yesBtn.removeEventListener("click", yes);
      noBtn.removeEventListener("click", no);
    }

    function yes(){ cleanup(); resolve(true); }
    function no(){ cleanup(); resolve(false); }

    yesBtn.addEventListener("click", yes);
    noBtn.addEventListener("click", no);
  });
}

// ===== START APP =====
document.addEventListener("DOMContentLoaded", ()=>App.init());
