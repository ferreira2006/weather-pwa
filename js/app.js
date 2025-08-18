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
  clearHistoryBtn: document.getElementById("clear-history-btn")
};

// ===== BOTÃO DE TEMA COM EMOJI =====
function updateThemeButton() {
  const isDark = document.body.classList.contains("dark");
  dom.themeToggle.textContent = isDark ? "☀️" : "🌑";
  dom.themeToggle.title = isDark ? "Modo claro" : "Modo escuro";
}

// ===== STATE =====
let currentCityValid = false;
let currentCity = "";
let currentStateAbbr = "";

// ===== WEATHER API =====
const WeatherAPI = {
  async fetchByCity(city) {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=5`);
    if (!res.ok) throw new Error("Previsão não disponível para esta cidade");
    return res.json();
  },
  async fetchByCoords(lat, lon) {
    const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}&days=5`);
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

    const stateAbbrDisplay = currentStateAbbr ? `, ${currentStateAbbr}` : `, ${data.city?.country || ''}`;
    dom.cityNameEl.textContent = `${data.city.name}${stateAbbrDisplay}`;
    dom.tempEl.textContent = `${Math.round(data.list[0].main.temp)}ºC`;
    dom.descEl.textContent = data.list[0].weather[0].description;
    dom.detailsEl.innerHTML = `Sensação: ${Math.round(data.list[0].main.feels_like)}ºC<br/>Umidade: ${data.list[0].main.humidity}%<br/>Vento: ${data.list[0].wind.speed} m/s`;

    // Previsão 5 dias às 12h
    const forecastContainer = dom.weatherContent.querySelector("#forecast") || dom.weatherContent;
    forecastContainer.innerHTML = "";
    const previsoesDiarias = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);
    previsoesDiarias.forEach(item => {
      const dateObj = new Date(item.dt_txt);
      const dateFormatted = dateObj.toLocaleDateString("pt-BR");
      const dayWeek = dateObj.toLocaleDateString("pt-BR",{ weekday:"long" });
      const temp = Math.round(item.main.temp);
      const desc = item.weather[0].description;
      const icon = item.weather[0].icon;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${dateFormatted}</h3>
        <p class="dia-semana">${dayWeek}</p>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
        <p><strong>${temp}°C</strong></p>
        <p>${desc}</p>
      `;
      forecastContainer.appendChild(card);
    });

    this.setWeatherIcon(data.list[0].weather[0].main);
    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    currentCityValid = true;
    currentCity = data.city.name;
    App.updateUIState();
    this.setDynamicBackground(data.list[0].weather[0].main);
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
    App.updateUIState();
  },

  renderHistory() { /* igual ao seu código existente */ },
  renderFavorites() { /* igual ao seu código existente */ },
  toggleThemeColors() { /* igual ao seu código existente */ },
  applySavedTheme() { /* igual ao seu código existente */ },
  setDynamicBackgroundFromCurrentIcon() { /* igual ao seu código existente */ }
};

// ===== FAVORITE ICON =====
const favIcon = document.createElement("span");
favIcon.id="fav-icon";
favIcon.classList.add("not-favorited");
favIcon.textContent="🤍";
dom.favBtn.prepend(favIcon);

// ===== APP =====
const App = {
  async handleCitySelect(city,stateAbbr="",isIBGECity=false){
    const normalizedCity = Utils.normalizeCityInput(city);
    if(!normalizedCity||(normalizedCity===currentCity&&currentCityValid)) return;
    currentStateAbbr=stateAbbr;
    dom.weatherDiv.classList.add("loading");

    try{
      const query = isIBGECity?`${normalizedCity},BR`:normalizedCity;
      const data = await WeatherAPI.fetchByCity(query);
      UI.showWeather(data);
      Storage.saveHistory(normalizedCity,stateAbbr);
      UI.renderHistory();
      Storage.saveLastCity(normalizedCity);
    }catch(err){ UI.showError(err.message||"Erro ao buscar o clima"); }
    finally{ dom.weatherDiv.classList.remove("loading"); }
  },

  async fetchByCoords(lat,lon){
    dom.weatherDiv.classList.add("loading");
    try{
      const data = await WeatherAPI.fetchByCoords(lat,lon);
      currentStateAbbr="";
      UI.showWeather(data);
      Storage.saveHistory(data.city.name);
      UI.renderHistory();
      Storage.saveLastCity(data.city.name);
    }catch(err){ UI.showError(err.message); if(!Storage.getLastCity()) await this.handleCitySelect("São Paulo"); }
    finally{ dom.weatherDiv.classList.remove("loading"); }
  },

  addFavorite(city){ /* igual ao seu código existente */ },
  async removeFavorite(displayText,cityName){ /* igual ao seu código existente */ },
  updateUIState(){ /* igual ao seu código existente */ },

  init(){
    dom.weatherDiv.classList.add("loading");

    UI.applySavedTheme();
    updateThemeButton();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateUIState();

    dom.favBtn.addEventListener("click", () => this.addFavorite(currentCity));
    dom.themeToggle.addEventListener("click", () => UI.toggleThemeColors());

    IBGE.init();

    window.addEventListener("scroll",()=>{ dom.scrollTopBtn.style.display = window.scrollY>150?"block":"none"; });
    dom.scrollTopBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
    dom.clearHistoryBtn.addEventListener("click", async ()=>{
      const confirmed=await showConfirmationModal("Deseja realmente limpar todo o histórico?");
      if(!confirmed) return;
      localStorage.removeItem("weatherHistory");
      UI.renderHistory();
      UI.showToast("Histórico limpo!");
      this.updateUIState();
    });

    // Inicializa cidade por geolocalização ou São Paulo
    const inicializaCidade = async (cidade) => {
      dom.citySelect.value = cidade;
      await this.handleCitySelect(cidade);
    };

    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        async pos => {
          try{
            const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&limit=1&appid=${API_KEY}`);
            const geoData = await geoRes.json();
            const cidadeGeo = geoData.length>0 ? geoData[0].name : "São Paulo";
            inicializaCidade(cidadeGeo);
          }catch{ inicializaCidade("São Paulo"); }
        },
        ()=>inicializaCidade("São Paulo")
      );
    } else inicializaCidade("São Paulo");
  }
};

// ===== CONFIRM MODAL =====
function showConfirmationModal(message){ /* igual ao seu código existente */ }

// ===== IBGE SELECTS =====
const IBGE = { /* igual ao seu código existente */ };

// ===== INIT APP =====
window.addEventListener("load", ()=>App.init());
