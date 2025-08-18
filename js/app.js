// ===== CONFIG =====
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const forecastUrl = "https://weather-backend-hh3w.onrender.com/forecast";
const maxHistoryItems = 5;

// ===== DOM ELEMENTS =====
const dom = {
  stateSelect: document.getElementById("state-select"),
  citySelect: document.getElementById("city-select"),
  searchBtn: document.getElementById("state-city-search-btn"),
  weatherSection: document.getElementById("weather"),
  cityName: document.getElementById("city-name"),
  stateAbbr: document.getElementById("state-abbr"),
  temp: document.getElementById("temp"),
  desc: document.getElementById("desc"),
  details: document.getElementById("details"),
  icon: document.getElementById("icon"),
  error: document.getElementById("weather-error"),
  spinner: document.getElementById("spinner"),
  favBtn: document.getElementById("fav-btn"),
  favIcon: document.getElementById("fav-icon"),
  favoritesList: document.getElementById("favorites-list"),
  historyList: document.getElementById("history-list"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),
  toast: document.getElementById("toast"),
  themeToggle: document.getElementById("theme-toggle"),
  scrollTopBtn: document.getElementById("scroll-top-btn"),
  forecastContainer: document.getElementById("forecast-container"),
};

// ===== UTILS =====
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  },

  showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    setTimeout(() => dom.toast.classList.remove("show"), 2500);
  }
};

// ===== IBGE STATES & CITIES =====
const IBGE = {
  async loadStates() {
    const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
    const states = await res.json();
    states.sort((a, b) => a.nome.localeCompare(b.nome));
    states.forEach(uf => {
      const opt = document.createElement("option");
      opt.value = uf.sigla;
      opt.textContent = uf.nome;
      dom.stateSelect.appendChild(opt);
    });
  },

  async loadCities(uf) {
    dom.citySelect.innerHTML = `<option value="">Selecione o município</option>`;
    dom.citySelect.disabled = true;
    if (!uf) return;
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    const cities = await res.json();
    cities.sort((a, b) => a.nome.localeCompare(b.nome));
    cities.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.nome;
      opt.textContent = c.nome;
      dom.citySelect.appendChild(opt);
    });
    dom.citySelect.disabled = false;
  }
};

// ===== THEME =====
const UI = {
  applySavedTheme() {
    const saved = localStorage.getItem("theme") || "light";
    document.body.className = saved;
    dom.themeToggle.textContent = saved === "dark" ? "Modo Claro" : "Modo Escuro";
    dom.themeToggle.setAttribute("aria-pressed", saved === "dark");
  },

  toggleTheme() {
    const isDark = document.body.classList.contains("dark");
    const newTheme = isDark ? "light" : "dark";
    document.body.className = newTheme;
    localStorage.setItem("theme", newTheme);
    dom.themeToggle.textContent = newTheme === "dark" ? "Modo Claro" : "Modo Escuro";
    dom.themeToggle.setAttribute("aria-pressed", newTheme === "dark");
  }
};

// ===== WEATHER =====
const Weather = {
  async fetchWeather(city, state) {
    dom.weatherSection.classList.add("loading");
    dom.error.textContent = "";
    dom.spinner.style.display = "block";

    try {
      const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&state=${state}`);
      if (!res.ok) throw new Error("Erro ao buscar clima.");
      const data = await res.json();
      this.renderWeather(data, city, state);
      History.add(city, state);
      Favorites.updateButton(city, state);
      this.fetchForecast(city, state);
    } catch (err) {
      this.showError(err.message);
    } finally {
      dom.spinner.style.display = "none";
      dom.weatherSection.classList.remove("loading");
    }
  },

  renderWeather(data, city, state) {
    dom.cityName.textContent = Utils.capitalizeCityName(city);
    dom.stateAbbr.textContent = state ? `- ${state}` : "";
    dom.temp.textContent = `${Math.round(data.main.temp)} °C`;
    dom.desc.textContent = data.weather[0].description;
    dom.details.textContent = `Umidade: ${data.main.humidity}% | Vento: ${data.wind.speed} m/s`;

    const map = {
      Clear: "wi-day-sunny",
      Clouds: "wi-cloudy",
      Rain: "wi-rain",
      Drizzle: "wi-sprinkle",
      Thunderstorm: "wi-thunderstorm",
      Snow: "wi-snow",
      Mist: "wi-fog"
    };

    const iconClass = map[data.weather[0].main] || "wi-day-sunny";
    dom.icon.className = `weather-icon wi ${iconClass}`;
  },

  showError(msg) {
    dom.error.textContent = msg;
  },

  async fetchForecast(city, state) {
    try {
      const res = await fetch(`${forecastUrl}?city=${encodeURIComponent(city)}&state=${state}`);
      if (!res.ok) throw new Error("Erro ao buscar previsão.");
      const data = await res.json();

      if (!data.list || data.list.length === 0) {
        this.showError("Não há previsão disponível.");
        return;
      }

      this.renderForecast(data);
    } catch (err) {
      console.error("Forecast error:", err);
    }
  },

  renderForecast(data) {
    dom.forecastContainer.innerHTML = "";
    const daily = {};

    data.list.forEach(item => {
      const date = item.dt_txt.split(" ")[0];
      if (!daily[date]) daily[date] = item;
    });

    const days = Object.values(daily).slice(0, 5);

    days.forEach(d => {
      const card = document.createElement("div");
      card.classList.add("forecast-card");

      const date = new Date(d.dt_txt);
      const day = date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "numeric" });

      card.innerHTML = `
        <div class="forecast-date">${day}</div>
        <i class="wi ${Weather.mapIcon(d.weather[0].main)} forecast-icon"></i>
        <div class="forecast-temp">${Math.round(d.main.temp)} °C</div>
        <div class="forecast-desc">${d.weather[0].description}</div>
      `;

      dom.forecastContainer.appendChild(card);
    });
  },

  mapIcon(condition) {
    const map = {
      Clear: "wi-day-sunny",
      Clouds: "wi-cloudy",
      Rain: "wi-rain",
      Drizzle: "wi-sprinkle",
      Thunderstorm: "wi-thunderstorm",
      Snow: "wi-snow",
      Mist: "wi-fog"
    };
    return map[condition] || "wi-day-sunny";
  }
};

// ===== FAVORITES =====
const Favorites = {
  list: JSON.parse(localStorage.getItem("favorites") || "[]"),

  save() {
    localStorage.setItem("favorites", JSON.stringify(this.list));
  },

  toggle(city, state) {
    const idx = this.list.findIndex(f => f.city === city && f.state === state);
    if (idx >= 0) {
      this.list.splice(idx, 1);
      Utils.showToast("Cidade removida dos favoritos.");
    } else {
      this.list.push({ city, state });
      Utils.showToast("Cidade adicionada aos favoritos.");
    }
    this.save();
    this.render();
    this.updateButton(city, state);
  },

  updateButton(city, state) {
    const isFav = this.list.some(f => f.city === city && f.state === state);
    dom.favIcon.className = isFav ? "favorited" : "not-favorited";
  },

  render() {
    dom.favoritesList.innerHTML = "";
    this.list.forEach(fav => {
      const li = document.createElement("li");
      li.textContent = `${fav.city} - ${fav.state}`;
      li.addEventListener("click", () => Weather.fetchWeather(fav.city, fav.state));
      dom.favoritesList.appendChild(li);
    });
  }
};

// ===== HISTORY =====
const History = {
  list: JSON.parse(localStorage.getItem("history") || "[]"),

  save() {
    localStorage.setItem("history", JSON.stringify(this.list));
  },

  add(city, state) {
    const exists = this.list.find(h => h.city === city && h.state === state);
    if (!exists) {
      this.list.unshift({ city, state });
      if (this.list.length > maxHistoryItems) this.list.pop();
      this.save();
      this.render();
    }
  },

  clear() {
    this.list = [];
    this.save();
    this.render();
  },

  render() {
    dom.historyList.innerHTML = "";
    this.list.forEach(h => {
      const li = document.createElement("li");
      li.textContent = `${h.city} - ${h.state}`;
      li.addEventListener("click", () => Weather.fetchWeather(h.city, h.state));
      dom.historyList.appendChild(li);
    });
  }
};

// ===== APP =====
const App = {
  async init() {
    UI.applySavedTheme();
    Favorites.render();
    History.render();
    await IBGE.loadStates();

    // Geolocalização inicial
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || "São Paulo";
            const state = data.address.state || "SP";
            Weather.fetchWeather(city, state);
          } catch {
            Weather.fetchWeather("São Paulo", "SP");
          }
        },
        () => Weather.fetchWeather("São Paulo", "SP")
      );
    } else {
      Weather.fetchWeather("São Paulo", "SP");
    }

    // Eventos
    dom.stateSelect.addEventListener("change", e => IBGE.loadCities(e.target.value));
    dom.citySelect.addEventListener("change", () => dom.searchBtn.disabled = !dom.citySelect.value);
    dom.searchBtn.addEventListener("click", () => {
      const city = dom.citySelect.value;
      const state = dom.stateSelect.value;
      if (city && state) Weather.fetchWeather(city, state);
    });

    dom.themeToggle.addEventListener("click", () => UI.toggleTheme());
    dom.favBtn.addEventListener("click", () => {
      const city = dom.cityName.textContent;
      const state = dom.stateAbbr.textContent.replace("- ", "");
      Favorites.toggle(city, state);
    });

    dom.clearHistoryBtn.addEventListener("click", () => History.clear());

    window.addEventListener("scroll", () => {
      dom.scrollTopBtn.style.display = window.scrollY > 200 ? "block" : "none";
    });
    dom.scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
