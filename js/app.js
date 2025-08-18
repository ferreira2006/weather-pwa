// ===== CONFIG =====
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ===== UTILS =====
const Utils = {
  capitalizeCityName(city) {
    return city.toLowerCase().split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
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
  historyListEl: document.getElementById("history-list"),
  favoritesListEl: document.getElementById("favorites-list"),
  toast: document.getElementById("toast"),
  stateSelect: document.getElementById("state-select"),
  citySelect: document.getElementById("city-select"),
  stateCitySearchBtn: document.getElementById("state-city-search-btn"),
  scrollTopBtn: document.getElementById("scroll-top-btn"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),
  forecastContainer: document.getElementById("forecast-container") // container para 5 dias
};

// ===== WEATHER API =====
const WeatherAPI = {
  async fetchByCity(city, days = 1) {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=${days}`);
    if (!res.ok) throw new Error("Previsão não disponível para esta cidade");
    return res.json();
  },
  async fetchByCoords(lat, lon, days = 1) {
    const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}&days=${days}`);
    if (!res.ok) throw new Error("Não foi possível obter o clima para sua localização.");
    return res.json();
  }
};

// ===== STORAGE =====
const Storage = {
  getHistory: () => JSON.parse(localStorage.getItem("weatherHistory")) || [],
  saveHistory(city, state = "") {
    const formattedCity = Utils.capitalizeCityName(city);
    const history = this.getHistory().filter(c => c.city.toLowerCase() !== formattedCity.toLowerCase());
    history.unshift({ city: formattedCity, state });
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
    const key = weather.toLowerCase().includes("cloud") ? "clouds" :
                weather.toLowerCase().includes("rain") || weather.toLowerCase().includes("drizzle") ? "rain" :
                weather.toLowerCase().includes("thunderstorm") ? "thunderstorm" :
                weather.toLowerCase().includes("snow") ? "snow" : "clear";
    document.body.classList.add(`bg-${key}`);
  },

  setWeatherIcon(mainWeather) {
    const map = {
      clear: ["wi", "wi-day-sunny"], clouds: ["wi", "wi-cloudy"], rain: ["wi", "wi-rain"],
      drizzle: ["wi", "wi-sprinkle"], thunderstorm: ["wi", "wi-thunderstorm"], snow: ["wi", "wi-snow"],
      mist: ["wi", "wi-fog"], smoke: ["wi", "wi-smoke"], haze: ["wi", "wi-day-haze"], dust: ["wi", "wi-dust"],
      fog: ["wi", "wi-fog"], sand: ["wi", "wi-sandstorm"], ash: ["wi", "wi-volcano"],
      squall: ["wi", "wi-strong-wind"], tornado: ["wi", "wi-tornado"]
    };
    const classes = map[mainWeather.toLowerCase()] || ["wi", "wi-day-sunny"];
    dom.iconEl.className = "weather-icon";
    dom.iconEl.classList.add(...classes);
  },

  showWeather(data) {
    document.body.classList.remove("error");
    dom.weatherError.style.display = "none";
    dom.weatherContent.style.display = "block";
    dom.iconEl.style.display = "block";

    const stateAbbrDisplay = currentStateAbbr ? `, ${currentStateAbbr}` : `, ${data.sys.country}`;
    dom.cityNameEl.textContent = `${data.name}${stateAbbrDisplay}`;
    dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    dom.descEl.textContent = data.weather[0].description;
    dom.detailsEl.innerHTML = `Sensação: ${Math.round(data.main.feels_like)}ºC<br/>Umidade: ${data.main.humidity}%<br/>Vento: ${data.wind.speed} m/s`;

    this.setWeatherIcon(data.weather[0].main);
    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    currentCityValid = true;
    currentCity = data.name;
    App.updateUIState();
    this.setDynamicBackground(data.weather[0].main);
  },

  showForecast(forecastData) {
    dom.forecastContainer.innerHTML = ""; // limpa cards anteriores
    forecastData.forEach(day => {
      const card = document.createElement("div");
      card.className = "forecast-card"; 
      card.innerHTML = `
        <div class="forecast-date">${day.date}</div>
        <i class="wi ${day.iconClass} forecast-icon"></i>
        <div class="forecast-temp">${Math.round(day.temp)}ºC</div>
        <div class="forecast-desc">${day.desc}</div>
      `;
      dom.forecastContainer.appendChild(card);
    });
  }
};

// ===== FAVORITE ICON =====
const favIcon = document.createElement("span");
favIcon.id="fav-icon";
favIcon.classList.add("not-favorited");
favIcon.textContent="🤍";
dom.favBtn.prepend(favIcon);

// ===== STATE =====
let currentCityValid = false;
let currentCity = "";
let currentStateAbbr = "";

// ===== IBGE SELECTS =====
const IBGE = {
  async init(){
    try{
      const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
      const states = await res.json();
      states.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id; 
        opt.textContent = s.nome; 
        opt.dataset.uf = s.sigla;
        dom.stateSelect.appendChild(opt);
      });
      dom.stateSelect.addEventListener("change", ()=>this.onStateChange());
      dom.citySelect.addEventListener("change", ()=>this.updateSearchButtonState());
      dom.stateCitySearchBtn.addEventListener("click", ()=>this.onSearchClick());
      this.updateSearchButtonState();
    } catch { UI.showToast("Erro ao carregar estados do IBGE."); }
  },
  async onStateChange(){
    const stateId = dom.stateSelect.value;
    dom.citySelect.innerHTML = '<option value="">Selecione o município</option>';
    dom.citySelect.disabled = true;
    dom.stateCitySearchBtn.disabled = true;
    if(!stateId) return;
    try{
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
      const cities = await res.json();
      cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city.nome; 
        option.textContent = city.nome;
        dom.citySelect.appendChild(option);
      });
      dom.citySelect.disabled = false;
    } catch { UI.showToast("Erro ao carregar municípios do IBGE."); }
  },
  updateSearchButtonState(){ dom.stateCitySearchBtn.disabled = !dom.citySelect.value; },
  onSearchClick(){
    const city = dom.citySelect.value;
    const stateAbbr = dom.stateSelect.selectedOptions[0]?.dataset.uf || "";
    if(city) App.handleCitySelect(city, stateAbbr, true);
  }
};

// ===== APP =====
const App = {
  async handleCitySelect(city,stateAbbr="",isIBGECity=false){
    const normalizedCity = Utils.normalizeCityInput(city);
    if(!normalizedCity||(normalizedCity===currentCity&&currentCityValid)) return;
    currentStateAbbr=stateAbbr;
    dom.weatherDiv.classList.add("loading");

    try{
      const query = isIBGECity?`${normalizedCity},BR`:normalizedCity;
      const data = await WeatherAPI.fetchByCity(query, 6); // 1 atual + 5 dias
      UI.showWeather(data.current);
      // Processa previsão para os próximos 5 dias
      const forecast = data.forecast.map(f => ({
        date: f.date,
        temp: f.temp,
        desc: f.desc,
        iconClass: `wi-${f.icon}` // ajustar conforme API retorna
      }));
      UI.showForecast(forecast);
      Storage.saveHistory(normalizedCity,stateAbbr);
      UI.renderHistory();
      Storage.saveLastCity(normalizedCity);
    }catch(err){ UI.showError(err.message||"Erro ao buscar o clima"); }
    finally{ dom.weatherDiv.classList.remove("loading"); }
  },
  async fetchByCoords(lat,lon){
    dom.weatherDiv.classList.add("loading");
    try{
      const data = await WeatherAPI.fetchByCoords(lat,lon,6);
      currentStateAbbr="";
      UI.showWeather(data.current);
      const forecast = data.forecast.map(f => ({
        date: f.date,
        temp: f.temp,
        desc: f.desc,
        iconClass: `wi-${f.icon}`
      }));
      UI.showForecast(forecast);
      Storage.saveHistory(data.name);
      UI.renderHistory();
      Storage.saveLastCity(data.name);
    }catch(err){ UI.showError(err.message); if(!Storage.getLastCity()) await this.handleCitySelect("São Miguel do Oeste"); }
    finally{ dom.weatherDiv.classList.remove("loading"); }
  },
  addFavorite(city){ ... }, // manter seu código existente
  removeFavorite(displayText,cityName){ ... },
  updateUIState(){ ... },
  init(){
    dom.weatherDiv.classList.add("loading");
    UI.applySavedTheme();
    updateThemeButton();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateUIState();
    dom.favBtn.addEventListener("click", () => this.addFavorite(currentCity));
    dom.themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      document.body.classList.toggle("light");
      Storage.saveTheme(document.body.classList.contains("dark") ? "dark" : "light");
      UI.setDynamicBackgroundFromCurrentIcon();
      updateThemeButton();
    });
    IBGE.init();
    window.addEventListener("scroll",()=>{ dom.scrollTopBtn.style.display = window.scrollY>150?"block":"none"; });
    dom.scrollTopBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
    dom.clearHistoryBtn.addEventListener("click", async ()=>{
      const confirmed = confirm("Deseja realmente limpar todo o histórico?");
      if(!confirmed) return;
      localStorage.removeItem("weatherHistory");
      UI.renderHistory();
      UI.showToast("Histórico limpo!");
      this.updateUIState();
    });
  }
};

// ===== INIT APP =====
window.addEventListener("load", ()=>App.init());
