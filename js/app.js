// ===== CONFIG =====
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// ===== UTILS =====
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
  forecastContainer: document.getElementById("forecast-container"),
  historyListEl: document.getElementById("history-list"),
  favoritesListEl: document.getElementById("favorites-list"),
  toast: document.getElementById("toast"),
  stateSelect: document.getElementById("state-select"),
  citySelect: document.getElementById("city-select"),
  stateCitySearchBtn: document.getElementById("state-city-search-btn"),
  scrollTopBtn: document.getElementById("scroll-top-btn"),
  clearHistoryBtn: document.getElementById("clear-history-btn")
};

// ===== THEME BUTTON =====
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
  async fetchByCity(city, days = 6) {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=${days}`);
    if (!res.ok) throw new Error("Previsão não disponível para esta cidade");
    return res.json();
  },
  async fetchByCoords(lat, lon, days = 6) {
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
    if(dom.iconEl) {
      dom.iconEl.className = "weather-icon";
      dom.iconEl.classList.add(...classes);
    }
  },

  showWeather(data) {
    document.body.classList.remove("error");
    if(dom.weatherError) dom.weatherError.style.display = "none";
    if(dom.weatherContent) dom.weatherContent.style.display = "block";
    if(dom.iconEl) dom.iconEl.style.display = "block";

    const stateAbbrDisplay = currentStateAbbr ? `, ${currentStateAbbr}` : `, ${data.sys?.country || ''}`;
    if(dom.cityNameEl) dom.cityNameEl.textContent = `${data.name}${stateAbbrDisplay}`;
    if(dom.tempEl) dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    if(dom.descEl) dom.descEl.textContent = data.weather[0].description;
    if(dom.detailsEl) dom.detailsEl.innerHTML = `Sensação: ${Math.round(data.main.feels_like)}ºC<br/>Umidade: ${data.main.humidity}%<br/>Vento: ${data.wind.speed} m/s`;

    this.setWeatherIcon(data.weather[0].main);
    currentCityValid = true;
    currentCity = data.name;
    App.updateUIState();
    this.setDynamicBackground(data.weather[0].main);

    // Renderiza cards de 5 dias
    this.renderForecastCards(data.forecast);
  },

  showError(message) {
    document.body.classList.add("error");
    if(dom.weatherError) {
      dom.weatherError.textContent = message;
      dom.weatherError.style.display = "block";
    }
    if(dom.weatherContent) dom.weatherContent.style.display = "none";
    if(dom.iconEl) dom.iconEl.style.display = "none";
    currentCityValid = false;
    App.updateUIState();
  },

  renderHistory() {
    if(!dom.historyListEl) return;
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
    if(!dom.favoritesListEl) return;
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

  renderForecastCards(forecast){
    if(!dom.forecastContainer) return;
    dom.forecastContainer.innerHTML = "";
    if(!forecast || !forecast.length) return;
    forecast.slice(0,5).forEach(day => {
      const card = document.createElement("div");
      card.className = "forecast-card";
      card.innerHTML = `
        <div class="day">${day.date}</div>
        <div class="icon wi wi-day-sunny"></div>
        <div class="temp">${Math.round(day.temp)}ºC</div>
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
if(dom.favBtn) dom.favBtn.prepend(favIcon);

// ===== APP =====
const App = {
  async handleCitySelect(city,stateAbbr="",isIBGECity=false){
    const normalizedCity = Utils.normalizeCityInput(city);
    if(!normalizedCity||(normalizedCity===currentCity&&currentCityValid)) return;
    currentStateAbbr=stateAbbr;
    if(dom.weatherDiv) dom.weatherDiv.classList.add("loading");

    try{
      const query = isIBGECity?`${normalizedCity},BR`:normalizedCity;
      const data = await WeatherAPI.fetchByCity(query,6); // fetch 6 days
      UI.showWeather(data);
      Storage.saveHistory(normalizedCity,stateAbbr);
      UI.renderHistory();
      Storage.saveLastCity(normalizedCity);
    }catch(err){ UI.showError(err.message||"Erro ao buscar o clima"); }
    finally{ if(dom.weatherDiv) dom.weatherDiv.classList.remove("loading"); }
  },

  updateUIState(){
    const history = Storage.getHistory();
    const favorites = Storage.getFavorites().filter(c=>c&&(typeof c==="string"?c:c.city)).map(c=>(typeof c==="string"?c:c.city).toLowerCase());

    if(dom.clearHistoryBtn) dom.clearHistoryBtn.disabled = history.length === 0;
    const canAddFavorite = currentCityValid && currentCity && !favorites.includes(currentCity.toLowerCase()) && favorites.length < 5;
    if(dom.favBtn) dom.favBtn.disabled = !canAddFavorite;

    if(favorites.includes(currentCity.toLowerCase())){
      favIcon.textContent="❤️";
      favIcon.classList.replace("not-favorited","favorited");
    } else {
      favIcon.textContent="🤍";
      favIcon.classList.replace("favorited","not-favorited");
    }
  },

  async init(){
    if(dom.weatherDiv) dom.weatherDiv.classList.add("loading");

    // Aplica tema
    UI.applySavedTheme();
    updateThemeButton();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateUIState();

    if(dom.favBtn) dom.favBtn.addEventListener("click", () => this.addFavorite(currentCity));
    if(dom.themeToggle) dom.themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      document.body.classList.toggle("light");
      Storage.saveTheme(document.body.classList.contains("dark") ? "dark" : "light");
      UI.setDynamicBackgroundFromCurrentIcon();
      updateThemeButton();
    });

    // Scroll top
    window.addEventListener("scroll",()=>{ if(dom.scrollTopBtn) dom.scrollTopBtn.style.display = window.scrollY>150?"block":"none"; });
    if(dom.scrollTopBtn) dom.scrollTopBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));

    // Clear history
    if(dom.clearHistoryBtn){
      dom.clearHistoryBtn.addEventListener("click", async ()=>{
        const confirmed = await showHistoryConfirmationModal("Deseja realmente limpar todo o histórico?");
        if(!confirmed) return;
        localStorage.removeItem("weatherHistory");
        UI.renderHistory();
        UI.showToast("Histórico limpo!");
        this.updateUIState();
      });
    }

    // Busca primeira cidade
    const lastCity = Storage.getLastCity() || "São Miguel do Oeste";
    await this.handleCitySelect(lastCity);
  }
};

// ===== HISTORY MODAL =====
function showHistoryConfirmationModal(message){
  return new Promise(resolve=>{
    const modal=document.getElementById("confirm-modal");
    if(!modal) return resolve(false);
    const overlay=modal.querySelector(".modal-overlay");
    modal.querySelector("p").textContent=message;
    modal.removeAttribute("hidden");
    const yesBtn=modal.querySelector("#confirm-yes");
    const noBtn=modal.querySelector("#confirm-no");
    const firstBtn=yesBtn;
    const lastBtn=noBtn;
    lastBtn.focus();
    const previousActive=document.activeElement;
    const cleanup=()=>{
      modal.setAttribute("hidden","");
      yesBtn.removeEventListener("click",yesHandler);
      noBtn.removeEventListener("click",noHandler);
      modal.removeEventListener("keydown",keyHandler);
      overlay.removeEventListener("click",overlayHandler);
      previousActive.focus();
    };
    const yesHandler=()=>{ cleanup(); resolve(true); };
    const noHandler=()=>{ cleanup(); resolve(false); };
    yesBtn.addEventListener("click",yesHandler);
    noBtn.addEventListener("click",noHandler);
    const keyHandler=e=>{
      if(e.key==="Tab"){
        if(e.shiftKey&&document.activeElement===firstBtn){ e.preventDefault(); lastBtn.focus(); }
        else if(!e.shiftKey&&document.activeElement===lastBtn){ e.preventDefault(); firstBtn.focus(); }
      } else if(e.key==="Escape"){ cleanup(); resolve(false); }
    };
    modal.addEventListener("keydown",keyHandler);
    const overlayHandler = e => e.stopPropagation();
    overlay.addEventListener("click", overlayHandler);
  });
}

// ===== INIT APP =====
window.addEventListener("load", ()=>App.init());

