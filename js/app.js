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
  forecastContainer: document.getElementById("forecast-container") // <--- novo container para forecast
};

// ===== BOTÃO DE TEMA COM EMOJI =====
function updateThemeButton() {
  const isDark = document.body.classList.contains("dark");
  dom.themeToggle.textContent = isDark ? "☀️" : "🌑";
  dom.themeToggle.title = isDark 
      ? "Modo claro" 
      : "Modo escuro";
}

// ===== STATE =====
let currentCityValid = false;
let currentCity = "";
let currentStateAbbr = "";

// ===== WEATHER API =====
const WeatherAPI = {
  async fetchByCity(city) {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=6`); // busca 6 dias (hoje + 5 próximos)
    if (!res.ok) throw new Error("Previsão não disponível para esta cidade");
    return res.json();
  },
  async fetchByCoords(lat, lon) {
    const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}&days=6`);
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

    // === Renderiza forecast dos próximos 5 dias ===
    if(data.daily) { 
      UI.renderForecast(data.daily.slice(1,6)); // pega os próximos 5 dias
    } else {
      dom.forecastContainer.innerHTML = "";
    }
  },

  renderForecast(dailyArray) {
    dom.forecastContainer.innerHTML = "";
    dailyArray.forEach(day => {
      const card = document.createElement("div");
      card.className = "forecast-card";

      const date = new Date(day.dt * 1000);
      const dayName = date.toLocaleDateString('pt-BR',{ weekday:'short' });

      const icon = document.createElement("i");
      icon.classList.add("weather-icon");
      const map = {
        Clear: "wi-day-sunny",
        Clouds: "wi-cloudy",
        Rain: "wi-rain",
        Drizzle: "wi-sprinkle",
        Thunderstorm: "wi-thunderstorm",
        Snow: "wi-snow",
        Mist: "wi-fog",
        Smoke: "wi-smoke",
        Haze: "wi-day-haze",
        Dust: "wi-dust",
        Fog: "wi-fog",
        Sand: "wi-sandstorm",
        Ash: "wi-volcano",
        Squall: "wi-strong-wind",
        Tornado: "wi-tornado"
      };
      const weatherMain = day.weather[0].main;
      icon.classList.add(map[weatherMain] || "wi-day-sunny");

      card.innerHTML = `<div>${dayName}</div>`;
      card.appendChild(icon);
      card.innerHTML += `<div>${Math.round(day.temp.min)}º / ${Math.round(day.temp.max)}º</div>`;

      dom.forecastContainer.appendChild(card);
    });
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

  renderForecast(dailyData) {
    let forecastContainer = document.getElementById("forecast-container");
    if (!forecastContainer) {
        forecastContainer = document.createElement("div");
        forecastContainer.id = "forecast-container";
        forecastContainer.style.display = "flex";
        forecastContainer.style.gap = "10px";
        forecastContainer.style.marginTop = "20px";
        forecastContainer.style.flexWrap = "wrap";
        dom.weatherContent.appendChild(forecastContainer);
    }
    forecastContainer.innerHTML = "";

    const next5Days = dailyData.slice(1, 6);

    next5Days.forEach(day => {
        const card = document.createElement("div");
        card.className = "forecast-card";
        card.style.flex = "1 1 100px";
        card.style.padding = "10px";
        card.style.borderRadius = "10px";
        card.style.background = "rgba(255,255,255,0.1)";
        card.style.textAlign = "center";

        const date = new Date(day.dt * 1000);
        const options = { weekday: "short", day: "numeric", month: "short" };
        const dayName = date.toLocaleDateString("pt-BR", options);

        const iconSpan = document.createElement("span");
        iconSpan.className = "wi weather-icon";
        const map = {
            clear: "wi-day-sunny", clouds: "wi-cloudy", rain: "wi-rain", drizzle: "wi-sprinkle",
            thunderstorm: "wi-thunderstorm", snow: "wi-snow", mist: "wi-fog", smoke: "wi-smoke",
            haze: "wi-day-haze", dust: "wi-dust", fog: "wi-fog", sand: "wi-sandstorm",
            ash: "wi-volcano", squall: "wi-strong-wind", tornado: "wi-tornado"
        };
        const mainWeather = day.weather[0].main.toLowerCase();
        iconSpan.classList.add(map[mainWeather] || "wi-day-sunny");
        iconSpan.style.fontSize = "1.5rem";
        card.appendChild(iconSpan);

        const dayEl = document.createElement("div");
        dayEl.textContent = dayName;
        dayEl.style.marginTop = "5px";
        card.appendChild(dayEl);

        const tempEl = document.createElement("div");
        tempEl.textContent = `${Math.round(day.temp.day)}ºC`;
        tempEl.style.fontWeight = "bold";
        tempEl.style.marginTop = "5px";
        card.appendChild(tempEl);

        forecastContainer.appendChild(card);
    });
  },

  renderHistory() {
    dom.historyListEl.innerHTML = "";
    Storage.getHistory().forEach(item => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.textContent = item.state ? `${item.city} (${item.state})` : item.city;
      li.title = "Clique para buscar.";
      li.addEventListener("click", () => App.handleCitySelect(item.city, item.state, true));
      li.addEventListener("keydown", e => { if(e.key==="Enter") App.handleCitySelect(item.city,item.state,true); });
      dom.historyListEl.appendChild(li);
    });
  },

  renderFavorites() {
    dom.favoritesListEl.innerHTML = "";
    Storage.getFavorites().forEach(item => {
      const cityName = typeof item === "string" ? item : item.city;
      const state = typeof item === "string" ? "" : item.state;
      const displayText = state ? `${cityName} (${state})` : cityName;
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.title = "Clique para buscar. Shift+Enter ou Delete para remover.";

      const citySpan = document.createElement("span");
      citySpan.textContent = displayText;
      citySpan.style.cursor = "pointer";
      citySpan.addEventListener("click", () => App.handleCitySelect(cityName, state, true));
      li.appendChild(citySpan);

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      Object.assign(removeBtn.style,{marginLeft:"8px",cursor:"pointer",background:"transparent",border:"none",fontWeight:"bold",fontSize:"1.2rem",lineHeight:"1",padding:"0"});
      removeBtn.addEventListener("click", e => { e.stopPropagation(); App.removeFavorite(displayText, cityName); });
      li.appendChild(removeBtn);

      li.addEventListener("keydown", e => {
        if(e.key==="Enter") App.handleCitySelect(cityName,state,true);
        if(e.key==="Delete"||e.key==="Backspace"||(e.key==="Enter"&&e.shiftKey)) App.removeFavorite(displayText, cityName);
      });

      dom.favoritesListEl.appendChild(li);
    });
  },

  toggleThemeColors() {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
    Storage.saveTheme(document.body.classList.contains("dark") ? "dark" : "light");
    this.setDynamicBackgroundFromCurrentIcon();

    const modal = document.getElementById("confirm-modal");
    modal.classList.remove("dark","light");
    modal.classList.add(document.body.classList.contains("dark") ? "dark" : "light");
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    document.body.classList.add(saved);
    document.body.classList.remove(saved==="dark"?"light":"dark");
    this.setDynamicBackgroundFromCurrentIcon();

    const modal = document.getElementById("confirm-modal");
    modal.classList.remove("dark","light");
    modal.classList.add(saved);
  },

  setDynamicBackgroundFromCurrentIcon() {
    if(!dom.iconEl) return;
    const mainClass = [...dom.iconEl.classList].find(c => c!=="weather-icon");
    this.setDynamicBackground(mainClass || "clear");
  }
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

      // Card principal
      UI.showWeather(data.current);

      // Próximos 5 dias
      UI.renderForecast(data.daily);

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
      UI.showWeather(data.current);
      UI.renderForecast(data.daily);
      Storage.saveHistory(data.name);
      UI.renderHistory();
      Storage.saveLastCity(data.name);
    }catch(err){ UI.showError(err.message); if(!Storage.getLastCity()) await this.handleCitySelect("São Miguel do Oeste"); }
    finally{ dom.weatherDiv.classList.remove("loading"); }
  },

  addFavorite(city){
    const formattedCity = Utils.capitalizeCityName(Utils.normalizeCityInput(city));
    const favorites = Storage.getFavorites();
    if(favorites.some(c=>(typeof c==="string"?c:c.city).toLowerCase()===formattedCity.toLowerCase())){
      UI.showToast(`"${formattedCity}" já está nos favoritos.`); return;
    }
    if(favorites.length>=5){ UI.showToast("Limite de 5 cidades favoritas atingido."); return; }
    favorites.push({city:formattedCity,state:currentStateAbbr});
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${formattedCity}" adicionado aos favoritos!`);
    this.updateUIState();
  },

  async removeFavorite(displayText,cityName){
    const confirmed = await showConfirmationModal(`Remover "${displayText}" dos favoritos?`);
    if(!confirmed) return;
    const favorites = Storage.getFavorites().filter(c=>(typeof c==="string"?c:c.city).toLowerCase()!==cityName.toLowerCase());
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${displayText}" removido dos favoritos.`);
    this.updateUIState();
  },

  updateUIState(){
    const history = Storage.getHistory();
    const favorites = Storage.getFavorites().filter(c=>c&&(typeof c==="string"?c:c.city)).map(c=>(typeof c==="string"?c:c.city).toLowerCase());

    dom.clearHistoryBtn.disabled = history.length === 0;
    const canAddFavorite = currentCityValid && currentCity && !favorites.includes(currentCity.toLowerCase()) && favorites.length < 5;
    dom.favBtn.disabled = !canAddFavorite;

    if(favorites.includes(currentCity.toLowerCase())){
      favIcon.textContent="❤️";
      favIcon.classList.replace("not-favorited","favorited");
    } else {
      favIcon.textContent="🤍";
      favIcon.classList.replace("favorited","not-favorited");
    }
  },

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
      const modal = document.getElementById("confirm-modal");
      modal.classList.remove("dark", "light");
      modal.classList.add(document.body.classList.contains("dark") ? "dark" : "light");
    });

    IBGE.init();

    window.addEventListener("scroll",()=>{ dom.scrollTopBtn.style.display = window.scrollY>150?"block":"none"; });
    dom.scrollTopBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));

    dom.clearHistoryBtn.addEventListener("click", async ()=>{
      const confirmed=await showHistoryConfirmationModal("Deseja realmente limpar todo o histórico?");
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
