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
  cityInput: document.getElementById("city-input"),
  searchBtn: document.getElementById("search-btn"),
  favBtn: document.getElementById("fav-btn"),
  themeToggle: document.getElementById("theme-toggle"),

  weatherDiv: document.getElementById("weather"),
  weatherContent: document.getElementById("weather-content"),
  weatherError: document.getElementById("weather-error"),
  spinner: document.getElementById("spinner"),

  cityNameEl: document.getElementById("city-name"),
  iconEl: document.getElementById("icon"),
  tempEl: document.getElementById("temp"),
  descEl: document.getElementById("desc"),
  detailsEl: document.getElementById("details"),

  historyListEl: document.getElementById("history-list"),
  favoritesListEl: document.getElementById("favorites-list"),
  toast: document.getElementById("toast"),
};

// ===== STATE =====
let currentCityValid = false;
let firstLoad = true;
let lastCityData = null; // Cache da última cidade

// ===== API =====
const WeatherAPI = {
  async fetchByCity(city) {
    if (lastCityData?.name === city) return lastCityData; // usa cache se disponível
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=1`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();
    lastCityData = data;
    return data;
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
    const classes = ["bg-clear","bg-clouds","bg-rain","bg-thunderstorm","bg-snow","bg-scattered-clouds","bg-fog"];
    document.body.classList.remove(...classes);

    weather = weather.toLowerCase();
    let key;
    if(weather.includes("scattered clouds")) key="scattered-clouds";
    else if(weather.includes("fog")||weather.includes("mist")||weather.includes("haze")) key="fog";
    else if(weather.includes("cloud")) key="clouds";
    else if(weather.includes("rain")||weather.includes("drizzle")) key="rain";
    else if(weather.includes("thunderstorm")) key="thunderstorm";
    else if(weather.includes("snow")) key="snow";
    else key="clear";

    document.body.classList.add(`bg-${key}`);
  },

  showWeather(data) {
    document.body.classList.remove("error");
    dom.weatherError.style.display="none";
    dom.weatherError.style.opacity=0;
    dom.weatherContent.style.display="block";
    dom.iconEl.style.display="block";

    dom.cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    dom.descEl.textContent = data.weather[0].description;
    dom.detailsEl.innerHTML = `Sensação: ${Math.round(data.main.feels_like)}ºC<br/>Umidade: ${data.main.humidity}%<br/>Vento: ${data.wind.speed} m/s`;

    const mainWeather = data.weather[0].main.toLowerCase();
    let iconClass;
    if(mainWeather.includes("scattered clouds")) iconClass="scattered-clouds";
    else if(mainWeather.includes("fog")||mainWeather.includes("mist")||mainWeather.includes("haze")) iconClass="fog";
    else iconClass=mainWeather;

    dom.iconEl.className=`weather-icon ${iconClass}`;

    dom.weatherDiv.hidden=false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({behavior:"smooth",block:"start"});

    currentCityValid=true;
    firstLoad=false;
    App.updateButtonsState();
    this.setDynamicBackground(data.weather[0].description);
  },

  showError(message) {
    document.body.classList.add("error");
    dom.weatherError.textContent=message;
    dom.weatherError.style.display="block";
    dom.weatherError.style.opacity="1";
    dom.weatherContent.style.display="none";
    dom.iconEl.style.display="none";
    dom.weatherDiv.hidden=false;
    dom.weatherDiv.focus();
    dom.weatherDiv.scrollIntoView({behavior:"smooth",block:"start"});
    currentCityValid=false;
    App.updateButtonsState();
  },

  // resto dos métodos de renderização e tema permanece igual...

  toggleThemeColors() {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
    Storage.saveTheme(document.body.classList.contains("dark") ? "dark" : "light");
    this.updateThemeColors();
    this.updateThemeToggleButton();
    this.setDynamicBackgroundFromCurrentIcon();
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    document.body.classList.add(saved);
    document.body.classList.remove(saved==="dark"?"light":"dark");
    this.updateThemeColors();
    this.updateThemeToggleButton();
    this.setDynamicBackgroundFromCurrentIcon();
  }
};

// ===== FAVORITE ICON =====
const favIcon=document.createElement("span");
favIcon.id="fav-icon";
favIcon.classList.add("not-favorited");
favIcon.textContent="🤍";
dom.favBtn.prepend(favIcon);

// ===== APP =====
const App = {
  async handleCitySelect(city) {
    const normalizedCity = Utils.normalizeCityInput(city);
    if(!normalizedCity || (normalizedCity.toLowerCase()===dom.cityInput.value.trim().toLowerCase() && currentCityValid)) return;
    dom.weatherDiv.classList.add("loading");
    try {
      dom.cityInput.value=normalizedCity;
      const data=await WeatherAPI.fetchByCity(normalizedCity);
      UI.showWeather(data);
      Storage.saveHistory(normalizedCity);
      UI.renderHistory();
      Storage.saveLastCity(normalizedCity);
      this.updateButtonsState();
    } catch(err) { UI.showError(err.message || "Erro ao buscar o clima"); }
    finally { dom.weatherDiv.classList.remove("loading"); }
  },

  async fetchByCoords(lat, lon) {
    dom.weatherDiv.classList.add("loading");
    try {
      const data=await WeatherAPI.fetchByCoords(lat, lon);
      UI.showWeather(data);
      Storage.saveHistory(data.name);
      UI.renderHistory();
      Storage.saveLastCity(data.name);
      this.updateButtonsState();
    } catch(err) {
      UI.showError(err.message);
      if(!Storage.getLastCity()) await this.handleCitySelect("São Miguel do Oeste");
    } finally { dom.weatherDiv.classList.remove("loading"); }
  },

  // addFavorite, removeFavorite e updateButtonsState permanecem iguais...

  init() {
    dom.weatherDiv.classList.add("loading");
    UI.applySavedTheme();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateButtonsState();

    document.getElementById("search-box").addEventListener("submit", e=>{
      e.preventDefault();
      const city=Utils.normalizeCityInput(dom.cityInput.value);
      if(!UI.isValidCityInput(city)) return UI.showToast("Informe uma cidade válida."); 
      this.handleCitySelect(city);
    });

    dom.cityInput.addEventListener("input", ()=>{ currentCityValid=false; this.updateButtonsState(); });
    dom.cityInput.addEventListener("click", ()=>{ dom.cityInput.value=""; currentCityValid=false; this.updateButtonsState(); });
    dom.favBtn.addEventListener("click", ()=>{ const city=Utils.normalizeCityInput(dom.cityInput.value); if(city) this.addFavorite(city); });
    dom.themeToggle.addEventListener("click", ()=>UI.toggleThemeColors());

    // Tema automático pelo sistema
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('dark');

    const lastCity=Storage.getLastCity();
    if(lastCity) this.handleCitySelect(lastCity);
    else if(navigator.geolocation) navigator.geolocation.getCurrentPosition(
      pos=>this.fetchByCoords(pos.coords.latitude,pos.coords.longitude),
      ()=>{ UI.showError("Não foi possível obter sua localização."); this.handleCitySelect("São Miguel do Oeste"); }
    );
    else this.handleCitySelect("São Miguel do Oeste");
  }
};

// ===== MODAL =====
function showConfirmationModal(message) {
  return new Promise(resolve=>{
    const modal=document.getElementById("confirm-modal");
    const desc=document.getElementById("confirm-modal-desc");
    const yesBtn=document.getElementById("confirm-yes");
    const noBtn=document.getElementById("confirm-no");

    desc.textContent=message;
    modal.hidden=false;
    modal.focus();

    const cleanUp=()=>{ yesBtn.removeEventListener("click",onYes); noBtn.removeEventListener("click",onNo); };
    const onYes=()=>{ cleanUp(); modal.hidden=true; resolve(true); };
    const onNo=()=>{ cleanUp(); modal.hidden=true; resolve(false); };

    yesBtn.addEventListener("click",onYes);
    noBtn.addEventListener("click",onNo);
  });
}

window.onload = () => App.init();
