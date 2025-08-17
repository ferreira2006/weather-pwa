const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ===== UTILS ======
const Utils = {
  showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
};

// ===== STORAGE ======
const Storage = {
  getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  },
  setFavorites(favs) {
    localStorage.setItem("favorites", JSON.stringify(favs));
  },
  getHistory() {
    return JSON.parse(localStorage.getItem("history") || "[]");
  },
  setHistory(hist) {
    localStorage.setItem("history", JSON.stringify(hist));
  }
};

// ===== UI ======
const UI = {
  stateSelect: document.getElementById("state-select"),
  citySelect: document.getElementById("city-select"),
  searchBtn: document.getElementById("search-btn"),
  favBtn: document.getElementById("fav-btn"),
  favIcon: document.getElementById("fav-icon"),
  weatherSection: document.getElementById("weather"),
  cityNameEl: document.getElementById("city-name"),
  tempEl: document.getElementById("temp"),
  descEl: document.getElementById("desc"),
  detailsEl: document.getElementById("details"),
  iconEl: document.getElementById("icon"),
  historyList: document.getElementById("history-list"),
  favoritesList: document.getElementById("favorites-list"),

  populateStates(states) {
    states.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.nome;
      this.stateSelect.appendChild(opt);
    });
  },

  populateCities(cities) {
    this.citySelect.innerHTML = `<option value="" disabled selected>Selecione a cidade</option>`;
    cities.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.nome;
      opt.textContent = c.nome;
      this.citySelect.appendChild(opt);
    });
    this.citySelect.disabled = false;
  },

  enableSearch() {
    if (this.stateSelect.value && this.citySelect.value) {
      this.searchBtn.disabled = false;
    } else {
      this.searchBtn.disabled = true;
    }
  }
};

// ===== APP ======
const App = {
  favorites: [],
  history: [],
  currentCity: null,

  init() {
    this.favorites = Storage.getFavorites();
    this.history = Storage.getHistory();
    UI.stateSelect.addEventListener("change", () => this.onStateChange());
    UI.citySelect.addEventListener("change", () => UI.enableSearch());
    UI.searchBtn.addEventListener("click", (e) => this.searchCity(e));
    UI.favBtn.addEventListener("click", () => this.toggleFavorite());
    this.loadStates();
    this.renderFavorites();
    this.renderHistory();
  },

  async loadStates() {
    try {
      const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
      const states = await res.json();
      // Ordena por nome
      states.sort((a,b)=>a.nome.localeCompare(b.nome));
      UI.populateStates(states);
    } catch(err) {
      Utils.showToast("Erro ao carregar estados");
      console.error(err);
    }
  },

  async onStateChange() {
    const stateId = UI.stateSelect.value;
    if (!stateId) return;
    UI.citySelect.disabled = true;
    UI.enableSearch();
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
      const cities = await res.json();
      UI.populateCities(cities);
      UI.enableSearch();
    } catch(err) {
      Utils.showToast("Erro ao carregar cidades");
      console.error(err);
    }
  },

  async searchCity(e) {
    e.preventDefault();
    const city = UI.citySelect.value;
    if (!city) return;

    UI.searchBtn.disabled = true;
    UI.favBtn.disabled = true;
    UI.weatherSection.classList.add("loading");

    try {
      const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error("Cidade não encontrada");
      const data = await res.json();
      this.showWeather(data);
      this.currentCity = city;
      this.updateHistory(city);
      this.updateFavButton();
    } catch(err) {
      UI.weatherSection.classList.add("error");
      UI.cityNameEl.textContent = "Erro";
      UI.descEl.textContent = err.message;
      console.error(err);
    } finally {
      UI.weatherSection.classList.remove("loading");
      UI.searchBtn.disabled = false;
      UI.favBtn.disabled = false;
    }
  },

  showWeather(data) {
    UI.cityNameEl.textContent = data.city;
    UI.tempEl.textContent = `${data.temp} °C`;
    UI.descEl.textContent = data.desc;
    UI.detailsEl.textContent = `Humidade: ${data.humidity} | Vento: ${data.wind} m/s`;
    UI.iconEl.className = `weather-icon ${data.icon}`;
  },

  updateHistory(city) {
    this.history = [city, ...this.history.filter(c => c !== city)].slice(0, maxHistoryItems);
    Storage.setHistory(this.history);
    this.renderHistory();
  },

  renderHistory() {
    UI.historyList.innerHTML = "";
    this.history.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c;
      li.tabIndex = 0;
      li.addEventListener("click", () => { UI.citySelect.value = c; this.searchCity(new Event('submit')); });
      UI.historyList.appendChild(li);
    });
  },

  toggleFavorite() {
    if (!this.currentCity) return;
    if (this.favorites.includes(this.currentCity)) {
      this.favorites = this.favorites.filter(c => c !== this.currentCity);
      Utils.showToast(`${this.currentCity} removida dos favoritos`);
    } else {
      this.favorites.push(this.currentCity);
      Utils.showToast(`${this.currentCity} adicionada aos favoritos`);
    }
    Storage.setFavorites(this.favorites);
    this.updateFavButton();
    this.renderFavorites();
  },

  updateFavButton() {
    if (!this.currentCity) return;
    if (this.favorites.includes(this.currentCity)) {
      UI.favIcon.classList.remove("not-favorited");
      UI.favIcon.classList.add("favorited");
    } else {
      UI.favIcon.classList.add("not-favorited");
      UI.favIcon.classList.remove("favorited");
    }
  },

  renderFavorites() {
    UI.favoritesList.innerHTML = "";
    this.favorites.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c;
      li.tabIndex = 0;
      li.addEventListener("click", () => { 
        if(confirm(`Remover ${c} dos favoritos?`)) {
          this.favorites = this.favorites.filter(f => f !== c);
          Storage.setFavorites(this.favorites);
          this.renderFavorites();
        }
      });
      UI.favoritesList.appendChild(li);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
