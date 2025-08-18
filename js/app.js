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
  forecastContainer: document.getElementById("forecast-container")
};

// ===== THEME =====
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
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=6`);
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

    const stateAbbrDisplay = currentStateAbbr ? `, ${currentStateAbbr}` : `, ${data.sys?.country || ""}`;
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

    // Render 5 dias
    this.renderForecast(data.daily || data.forecast);
  },

  renderForecast(dailyData) {
    dom.forecastContainer.innerHTML = "";
    if (!dailyData || dailyData.length < 2) return;

    for (let i = 1; i <= 5 && i < dailyData.length; i++) {
      const day = dailyData[i];
      const dateObj = new Date(day.dt * 1000);
      const dateFormatted = dateObj.toLocaleDateString("pt-BR");
      const weekday = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
      const temp = Math.round(day.temp.day);
      const desc = day.weather[0].description;
      const icon = day.weather[0].icon;

      const card = document.createElement("div");
      card.className = "forecast-card";
      card.innerHTML = `
        <div class="forecast-date">${dateFormatted}</div>
        <div class="forecast-weekday">${weekday}</div>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
        <div class="forecast-temp">${temp}ºC</div>
        <div class="forecast-desc">${desc}</div>
      `;
      dom.forecastContainer.appendChild(card);
    }
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
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    document.body.classList.add(saved);
    document.body.classList.remove(saved==="dark"?"light":"dark");
    this.setDynamicBackgroundFromCurrentIcon();
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

// ===== CONFIRM MODAL =====
function showConfirmationModal(message){
  return new Promise(resolve=>{
    const modal=document.getElementById("confirm-modal");
    const overlay=modal.querySelector(".modal-overlay");
    modal.querySelector("p").textContent=message;
    modal.removeAttribute("hidden");
    const yesBtn=modal.querySelector("#confirm-yes");
    const noBtn=modal.querySelector("#confirm-no");
    const focusable=[yesBtn,noBtn];
    const firstBtn=focusable[0];
    const lastBtn=focusable[focusable.length-1];
    const previousActive=document.activeElement;
    lastBtn.focus();
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
      Storage.saveHistory(data.name);
      UI.renderHistory();
      Storage.saveLastCity(data.name);
    }catch(err){
      UI.showError(err.message);
      if(!Storage.getLastCity()) await this.handleCitySelect("São Miguel do Oeste","SC");
    }finally{ dom.weatherDiv.classList.remove("loading"); }
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
    const favorites = Storage.getFavorites().filter(c => c && (typeof c === "string" ? c : c.city))
                     .map(c => (typeof c === "string" ? c : c.city).toLowerCase());

    dom.clearHistoryBtn.disabled = history.length === 0;

    const canAddFavorite = currentCityValid && currentCity && !favorites.includes(currentCity.toLowerCase()) && favorites.length < 5;
    dom.favBtn.disabled = !canAddFavorite;

    if (favorites.includes(currentCity.toLowerCase())) {
      favIcon.textContent = "❤️";
      favIcon.classList.replace("not-favorited", "favorited");
    } else {
      favIcon.textContent = "🤍";
      favIcon.classList.replace("favorited", "not-favorited");
    }

    dom.stateCitySearchBtn.disabled = !dom.citySelect.value;
    dom.citySelect.disabled = dom.citySelect.options.length <= 1;
  },

  async init(){
    dom.weatherDiv.classList.add("loading");

    UI.applySavedTheme();
    updateThemeButton();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateUIState();

    dom.favBtn.addEventListener("click", () => this.addFavorite(currentCity));
    dom.themeToggle.addEventListener("click", () => { UI.toggleThemeColors(); updateThemeButton(); });

    await IBGE.init();

    try {
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
          pos => this.fetchByCoords(pos.coords.latitude,pos.coords.longitude),
          async () => await this.handleCitySelect("São Miguel do Oeste","SC")
        );
      } else {
        await this.handleCitySelect("São Miguel do Oeste","SC");
      }
    } catch(e){
      await this.handleCitySelect("São Miguel do Oeste","SC");
    }

    window.addEventListener("scroll",()=>{ dom.scrollTopBtn.style.display = window.scrollY>150?"block":"none"; });
    dom.scrollTopBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));

    dom.clearHistoryBtn.addEventListener("click", async ()=>{
      const confirmed = await showConfirmationModal("Deseja realmente limpar todo o histórico?");
      if(!confirmed) return;
      localStorage.removeItem("weatherHistory");
      UI.renderHistory();
      this.updateUIState();
    });
  }
};

// ===== IBGE =====
const IBGE = {
  async init(){
    try{
      const statesRes = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
      const states = await statesRes.json();
      states.sort((a,b)=>a.nome.localeCompare(b.nome));
      dom.stateSelect.innerHTML = '<option value="">Selecione o Estado</option>';
      states.forEach(s=>{const o=document.createElement("option");o.value=s.sigla;o.textContent=s.nome;dom.stateSelect.appendChild(o);});

      dom.stateSelect.addEventListener("change",async()=>{
        dom.citySelect.innerHTML = '<option value="">Carregando...</option>';
        const stateCode = dom.stateSelect.value;
        if(!stateCode) return;
        const citiesRes = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios`);
        const cities = await citiesRes.json();
        dom.citySelect.innerHTML = '<option value="">Selecione a Cidade</option>';
        cities.forEach(c=>{const o=document.createElement("option");o.value=c.nome;o.textContent=c.nome;dom.citySelect.appendChild(o);});
        App.updateUIState();
      });

      dom.stateCitySearchBtn.addEventListener("click",()=>{
        const city = dom.citySelect.value;
        const state = dom.stateSelect.value;
        if(city) App.handleCitySelect(city,state,true);
      });
    }catch(e){ console.error("Erro ao carregar IBGE",e); }
  }
};

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded",()=>App.init());
