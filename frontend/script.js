const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const maxHistoryItems = 5;

// Elementos do DOM agrupados para facilitar acesso e manutenção
const dom = {
  cityInput: document.getElementById("city-input"),
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
};

// Estado global simples para controlar se a última busca foi válida
let currentCityValid = false;

// ===== API =====
// Encapsula chamadas à API externa para buscar dados do clima
const WeatherAPI = {
  // Busca clima por nome da cidade, lança erro se cidade não encontrada
  async fetchByCity(city) {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=1`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    return res.json();
  },

  // Busca clima por coordenadas geográficas, lança erro se falhar
  async fetchByCoords(lat, lon) {
    const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}&days=1`);
    if (!res.ok) throw new Error("Não foi possível obter o clima para sua localização.");
    return res.json();
  }
};

// ===== STORAGE =====
const Storage = {
  getHistory() {
    return JSON.parse(localStorage.getItem("weatherHistory")) || [];
  },

  saveHistory(city) {
    let history = this.getHistory();
    history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
    history.unshift(city);
    if (history.length > maxHistoryItems) history = history.slice(0, maxHistoryItems);
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  },

  getFavorites() {
    return JSON.parse(localStorage.getItem("weatherFavorites")) || [];
  },

  saveFavorites(favorites) {
    localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
  },

  getTheme() {
    return localStorage.getItem("theme") || "light";
  },

  saveTheme(theme) {
    localStorage.setItem("theme", theme);
  },

  getLastCity() {
    return localStorage.getItem("lastCity");
  },

  saveLastCity(city) {
    localStorage.setItem("lastCity", city);
  }
};

function capitalizeCityName(city) {
  return city
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

// ===== UI =====
const UI = {
  isValidCityInput(city) {
    return city.trim().length > 0;
  },

  showToast(message, duration = 3000) {
    const t = dom.toast;
    t.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), duration);
  },

  setDynamicBackground(mainWeather) {
    const classes = ["bg-clear", "bg-clouds", "bg-rain", "bg-thunderstorm", "bg-snow"];
    document.body.classList.remove(...classes);

    mainWeather = mainWeather.toLowerCase();
    let weatherKey = "clear";
    if (mainWeather.includes("clear")) weatherKey = "clear";
    else if (mainWeather.includes("cloud")) weatherKey = "clouds";
    else if (mainWeather.includes("rain") || mainWeather.includes("drizzle")) weatherKey = "rain";
    else if (mainWeather.includes("thunderstorm")) weatherKey = "thunderstorm";
    else if (mainWeather.includes("snow")) weatherKey = "snow";

    document.body.classList.add(`bg-${weatherKey}`);
  },

  setDynamicBackgroundFromCurrentIcon() {
    if (!dom.weatherDiv.hidden) {
      const mainClass = [...dom.iconEl.classList].find(c => c !== "weather-icon");
      this.setDynamicBackground(mainClass || "clear");
    } else {
      this.setDynamicBackground("clear");
    }
  },

  showWeather(data) {
    document.body.classList.remove("error");

    dom.weatherError.textContent = "";
    dom.weatherError.style.display = "none";
    dom.weatherError.style.opacity = "0";

    dom.weatherContent.style.display = "block";
    dom.iconEl.style.display = "block";

    dom.cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    dom.tempEl.textContent = `${Math.round(data.main.temp)}ºC`;
    dom.descEl.textContent = data.weather[0].description;

    dom.detailsEl.innerHTML = `
      Sensação: ${Math.round(data.main.feels_like)}ºC<br/>
      Umidade: ${data.main.humidity}%<br/>
      Vento: ${data.wind.speed} m/s
    `;

    dom.iconEl.className = "weather-icon";
    const mainClass = data.weather[0].main.toLowerCase();
    dom.iconEl.classList.add(mainClass);

    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();

    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    currentCityValid = true;
    App.updateButtonsState();

    this.setDynamicBackground(data.weather[0].main);
  },

  showError(message) {
    document.body.classList.add("error");

    dom.weatherError.textContent = message;
    dom.weatherError.style.display = "block";
    dom.weatherError.style.opacity = "1";

    dom.weatherContent.style.display = "none";
    dom.iconEl.style.display = "none";

    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();

    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    currentCityValid = false;
    App.updateButtonsState();
  },

  updateThemeColors() {
    const rootStyles = getComputedStyle(document.documentElement);
    const isDark = document.body.classList.contains("dark");

    dom.cityInput.style.color = isDark ? rootStyles.getPropertyValue('--input-text-dark').trim() : rootStyles.getPropertyValue('--input-text-light').trim();
    dom.cityInput.style.backgroundColor = isDark ? rootStyles.getPropertyValue('--input-bg-dark').trim() : rootStyles.getPropertyValue('--input-bg-light').trim();

    const buttonBg = rootStyles.getPropertyValue('--button-bg').trim();

    [dom.searchBtn, dom.favBtn].forEach(btn => {
      btn.style.backgroundColor = buttonBg;
      btn.style.color = isDark ? '#ddd' : '#fff';
    });

    [...dom.historyListEl.children, ...(dom.favoritesListEl ? [...dom.favoritesListEl.children] : [])].forEach(li => {
      li.style.backgroundColor = buttonBg;
      li.style.color = isDark ? '#ddd' : '#fff';
    });

    dom.detailsEl.style.color = isDark ? '#ddd' : '#000';

    dom.weatherError.style.color = isDark ? '#ffbaba' : '#b00000';
    dom.weatherError.style.backgroundColor = isDark ? '#5c0000' : '#ffdede';

    dom.themeToggle.style.color = isDark ? '#ddd' : '#000';
    dom.themeToggle.style.borderColor = isDark ? '#ddd' : '#000';
  },

  updateThemeToggleButton() {
    const isDark = document.body.classList.contains("dark");
    dom.themeToggle.textContent = isDark ? "Modo Claro" : "Modo Escuro";
    dom.themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  },

  renderHistory() {
    const history = Storage.getHistory();
    dom.historyListEl.innerHTML = "";
    history.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.textContent = city;
      li.setAttribute("aria-label", `Buscar clima da cidade ${city}`);

      li.addEventListener("click", () => App.handleCitySelect(city));
      li.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          App.handleCitySelect(city);
        }
      });

      dom.historyListEl.appendChild(li);
    });
    this.updateThemeColors();
  },

  renderFavorites() {
    const favorites = Storage.getFavorites();
    dom.favoritesListEl.innerHTML = "";

    favorites.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.setAttribute("aria-label", `Cidade favorita ${city}. Pressione Enter para buscar, Delete para remover.`);

      const citySpan = document.createElement("span");
      citySpan.textContent = city;
      citySpan.style.cursor = "pointer";
      citySpan.title = "Clique para buscar";
      citySpan.setAttribute("role", "button");
      citySpan.setAttribute("tabindex", "0");
      citySpan.setAttribute("aria-label", `Buscar clima da cidade ${city}`);
      citySpan.addEventListener("click", () => App.handleCitySelect(city));
      citySpan.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          App.handleCitySelect(city);
        }
      });

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.title = `Remover ${city} dos favoritos`;
      removeBtn.setAttribute("aria-label", `Remover ${city} dos favoritos`);
      Object.assign(removeBtn.style, {
        marginLeft: "8px",
        cursor: "pointer",
        background: "transparent",
        border: "none",
        color: "inherit",
        fontWeight: "bold",
        fontSize: "1.2rem",
        lineHeight: "1",
        padding: "0",
        outlineOffset: "2px",
      });

      removeBtn.addEventListener("click", e => {
        e.stopPropagation();
        App.removeFavorite(city);
      });

      li.addEventListener("keydown", e => {
        if (["Delete", "Backspace"].includes(e.key) || (e.key === "Enter" && e.shiftKey)) {
          e.preventDefault();
          App.removeFavorite(city);
        }
      });

      li.title = "Clique para buscar. Pressione Shift+Enter ou Delete para remover dos favoritos.";

      li.appendChild(citySpan);
      li.appendChild(removeBtn);
      dom.favoritesListEl.appendChild(li);
    });

    this.updateThemeColors();
  },

  toggleThemeColors() {
    const isDark = document.body.classList.contains("dark");
    if (isDark) {
      document.body.classList.remove("dark");
      document.body.classList.add("light");
      Storage.saveTheme("light");
    } else {
      document.body.classList.remove("light");
      document.body.classList.add("dark");
      Storage.saveTheme("dark");
    }
    this.updateThemeColors();
    this.updateThemeToggleButton();
    this.setDynamicBackgroundFromCurrentIcon();
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    document.body.classList.toggle("dark", saved === "dark");
    document.body.classList.toggle("light", saved !== "dark");
    this.updateThemeColors();
    this.updateThemeToggleButton();
    this.setDynamicBackgroundFromCurrentIcon();
  }
};

// ===== APP (Lógica e eventos) =====
const App = {
  async handleCitySelect(city) {
    dom.cityInput.value = city;
    try {
      const data = await WeatherAPI.fetchByCity(city);
      UI.showWeather(data);
      Storage.saveHistory(city);
      UI.renderHistory();
      Storage.saveLastCity(city);
      this.updateButtonsState();
    } catch (err) {
      UI.showError(err.message || "Erro ao buscar o clima");
    }
  },

  async fetchByCoords(lat, lon) {
    try {
      const data = await WeatherAPI.fetchByCoords(lat, lon);
      UI.showWeather(data);
      Storage.saveHistory(data.name);
      UI.renderHistory();
      Storage.saveLastCity(data.name);
      this.updateButtonsState();
    } catch (err) {
      UI.showError(err.message);
      try {
        await this.handleCitySelect("São Miguel do Oeste");
      } catch {
        UI.showError("Não foi possível obter o clima para sua localização nem para a cidade padrão.");
        currentCityValid = false;
        this.updateButtonsState();
      }
    }
  },

  addFavorite(city) {
    const formattedCity = capitalizeCityName(city);

  let favorites = Storage.getFavorites() || [];

  // Evita duplicados (comparação lowercase)
  if (favorites.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
    UI.showToast(`"${formattedCity}" já está nos favoritos.`);
    return;
  }

  favorites.push(formattedCity);
  Storage.saveFavorites(favorites);
  UI.renderFavorites();
  UI.showToast(`"${formattedCity}" adicionado aos favoritos!`);
  updateButtonsState(); // sua função para atualizar UI
  },

  async removeFavorite(city) {
    const confirmed = await showConfirmationModal(`Tem certeza que deseja remover "${city}" dos favoritos?`);
    if (!confirmed) return;

    let favorites = Storage.getFavorites();
    favorites = favorites.filter(c => c.toLowerCase() !== city.toLowerCase());
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${city}" removido dos favoritos.`);
    this.updateButtonsState();
  },  // <-- Virgulinha importante aqui!

  // Atualiza estado dos botões Buscar e Favorito
  updateButtonsState() {
    const city = dom.cityInput.value.trim().toLowerCase();
    const favorites = Storage.getFavorites().map(c => c.toLowerCase());
    const isCityInFavorites = favorites.includes(city);
    const isCityEmpty = city === '';

    // Habilita botão buscar se input não vazio
    dom.searchBtn.disabled = isCityEmpty;

    // Botão favorito habilitado só se cidade válida, não vazia, não favorita e botão buscar habilitado
    dom.favBtn.disabled = !currentCityValid || isCityEmpty || dom.searchBtn.disabled || isCityInFavorites;
  },

  init() {
    UI.applySavedTheme();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateButtonsState();

    dom.cityInput.addEventListener("click", () => {
        const city = dom.cityInput.value.trim();
    if (!UI.isValidCityInput(city)) {
    UI.showToast("Por favor, informe uma cidade válida.");
    return;
  }
  App.handleCitySelect(city);  // usar App diretamente
    });

    dom.cityInput.addEventListener("input", () => {
      currentCityValid = false;
      this.updateButtonsState();
    });

    dom.searchBtn.addEventListener("click", () => {
      const city = dom.cityInput.value.trim();
      if (!UI.isValidCityInput(city)) {
        UI.showToast("Por favor, informe uma cidade válida.");
        return;
      }
      this.handleCitySelect(city);
    });

    dom.cityInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        const city = dom.cityInput.value.trim();
        if (!UI.isValidCityInput(city)) {
          UI.showToast("Por favor, informe uma cidade válida.");
          return;
        }
        dom.searchBtn.click();
      }
    });

    dom.favBtn.addEventListener("click", () => {
      const city = dom.cityInput.value.trim();
      if (!city) return;
      this.addFavorite(city);
    });

    dom.themeToggle.addEventListener("click", () => UI.toggleThemeColors());

    const lastCity = Storage.getLastCity();
    if (lastCity) {
      this.handleCitySelect(lastCity);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => this.fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        () => {
          UI.showError("Não foi possível obter sua localização. Exibindo clima para São Miguel do Oeste.");
          this.handleCitySelect("São Miguel do Oeste");
        }
      );
    } else {
      this.handleCitySelect("São Miguel do Oeste");
    }
  }
};

function showConfirmationModal(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    const desc = document.getElementById("confirm-modal-desc");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");

    desc.textContent = message;
    modal.hidden = false;

    function cleanUp() {
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
    }

    function onYes() {
      cleanUp();
      modal.hidden = true;
      resolve(true);
    }

    function onNo() {
      cleanUp();
      modal.hidden = true;
      resolve(false);
    }

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}

// Inicializa app após carregamento da página
window.onload = () => App.init();
