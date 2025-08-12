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
// Funções para interagir com o localStorage, abstraindo o armazenamento dos dados
const Storage = {
  // Retorna o histórico de cidades buscadas, ou array vazio se não existir
  getHistory() {
    return JSON.parse(localStorage.getItem("weatherHistory")) || [];
  },

  // Salva cidade no histórico, garantindo não duplicar e limitando tamanho máximo
  saveHistory(city) {
    let history = this.getHistory();
    // Remove duplicatas, insere nova cidade no começo
    history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
    history.unshift(city);
    if (history.length > maxHistoryItems) history = history.slice(0, maxHistoryItems);
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  },

  // Retorna lista de cidades favoritas, ou array vazio se não existir
  getFavorites() {
    return JSON.parse(localStorage.getItem("weatherFavorites")) || [];
  },

  // Salva lista atualizada de favoritos no localStorage
  saveFavorites(favorites) {
    localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
  },

  // Retorna tema salvo ("light" ou "dark"), padrão "light"
  getTheme() {
    return localStorage.getItem("theme") || "light";
  },

  // Salva tema atual no localStorage
  saveTheme(theme) {
    localStorage.setItem("theme", theme);
  },

  // Retorna a última cidade buscada (string) ou null
  getLastCity() {
    return localStorage.getItem("lastCity");
  },

  // Salva a última cidade buscada
  saveLastCity(city) {
    localStorage.setItem("lastCity", city);
  }
};

// ===== UI =====
// Responsável pela manipulação direta da interface e seus elementos
const UI = {
  // Validação simples para garantir que o input não está vazio
  isValidCityInput(city) {
    return city.trim().length > 0;
  },

  // Mostra mensagem temporária (toast) para feedback rápido ao usuário
  showToast(message, duration = 3000) {
    const t = dom.toast;
    t.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), duration);
  },

  // Atualiza o background do body baseado no tipo principal do clima
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

  // Define background com base no ícone/classe atual do clima mostrado
  setDynamicBackgroundFromCurrentIcon() {
    if (!dom.weatherDiv.hidden) {
      const mainClass = [...dom.iconEl.classList].find(c => c !== "weather-icon");
      this.setDynamicBackground(mainClass || "clear");
    } else {
      this.setDynamicBackground("clear");
    }
  },

  // Exibe os dados do clima na UI, atualizando todos os elementos relevantes
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

    // Atualiza classe do ícone para alterar imagem conforme clima
    dom.iconEl.className = "weather-icon";
    const mainClass = data.weather[0].main.toLowerCase();
    dom.iconEl.classList.add(mainClass);

    // Torna o card de clima visível e foca nele para acessibilidade
    dom.weatherDiv.hidden = false;
    dom.weatherDiv.focus();

    // Scroll suave até o card de clima
    dom.weatherDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    // Marca busca atual como válida para habilitar botões relacionados
    currentCityValid = true;
    App.updateFavBtnState();

    // Atualiza o background da página de acordo com o clima atual
    this.setDynamicBackground(data.weather[0].main);
  },

  // Mostra mensagem de erro no card de clima, ocultando dados
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
    App.updateFavBtnState();
  },

  // Atualiza cores de acordo com o tema (dark/light) para vários elementos
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

  // Atualiza o texto e aria-pressed do botão de troca de tema
  updateThemeToggleButton() {
    const isDark = document.body.classList.contains("dark");
    dom.themeToggle.textContent = isDark ? "Modo Claro" : "Modo Escuro";
    dom.themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  },

  // Renderiza a lista de histórico de cidades buscadas
  renderHistory() {
    const history = Storage.getHistory();
    dom.historyListEl.innerHTML = "";
    history.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.textContent = city;
      li.setAttribute("aria-label", `Buscar clima da cidade ${city}`);

      // Busca ao clicar ou ao apertar Enter / Espaço
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

  // Renderiza lista de cidades favoritas, com opções para buscar e remover
  renderFavorites() {
    const favorites = Storage.getFavorites();
    dom.favoritesListEl.innerHTML = "";

    favorites.forEach(city => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.setAttribute("aria-label", `Cidade favorita ${city}. Pressione Enter para buscar, Delete para remover.`);

      // Span clicável para buscar cidade favorita
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

      // Botão para remover cidade dos favoritos
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

      // Atalhos para remover (Delete, Backspace, Shift+Enter)
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

  // Alterna tema dark/light e atualiza a UI e armazenamento
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

  // Aplica o tema salvo ao carregar a página
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
// Controla fluxo principal da aplicação, coordena API, Storage e UI
const App = {
  // Realiza busca do clima pela cidade e atualiza UI e histórico
  async handleCitySelect(city) {
    dom.cityInput.value = city;
    try {
      const data = await WeatherAPI.fetchByCity(city);
      UI.showWeather(data);
      Storage.saveHistory(city);
      UI.renderHistory();
      Storage.saveLastCity(city);
      this.updateFavBtnState();
    } catch (err) {
      UI.showError(err.message || "Erro ao buscar o clima");
    }
  },

  // Busca clima por coordenadas (usada para geolocalização)
  async fetchByCoords(lat, lon) {
    try {
      const data = await WeatherAPI.fetchByCoords(lat, lon);
      UI.showWeather(data);
      Storage.saveHistory(data.name);
      UI.renderHistory();
      Storage.saveLastCity(data.name);
      this.updateFavBtnState();
    } catch (err) {
      UI.showError(err.message);
      this.handleCitySelect("São Miguel do Oeste");
    }
  },

  // Adiciona cidade aos favoritos, evita duplicatas e atualiza UI
  addFavorite(city) {
    let favorites = Storage.getFavorites();
    if (favorites.some(c => c.toLowerCase() === city.toLowerCase())) {
      UI.showToast(`"${city}" já está nos favoritos.`);
      return;
    }
    favorites.push(city);
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${city}" adicionado aos favoritos!`);
    console.log();
    this.updateFavBtnState();
  },

  // Remove cidade dos favoritos após confirmação, atualiza UI
  removeFavorite(city) {
    const confirmed = confirm(`Tem certeza que deseja remover "${city}" dos favoritos?`);
    if (!confirmed) return;

    let favorites = Storage.getFavorites();
    favorites = favorites.filter(c => c.toLowerCase() !== city.toLowerCase());
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${city}" removido dos favoritos.`);
    this.updateFavBtnState();
  },

  // Atualiza estado (habilitado/desabilitado) do botão "Adicionar Favorito"
  updateFavBtnState() {
    const city = dom.cityInput.value.trim().toLowerCase();
    const favorites = Storage.getFavorites().map(c => c.toLowerCase());

    const isCityInFavorites = favorites.includes(city);
    const isCityEmpty = city === '';

    // Habilita botão só se a cidade for válida, não vazia, não nos favoritos e a busca não estiver em andamento
    dom.favBtn.disabled = !currentCityValid || isCityEmpty || dom.searchBtn.disabled || isCityInFavorites;
  },

  // Inicializa a aplicação: aplica tema, renderiza listas, registra eventos e tenta carregar dados iniciais
  init() {
    UI.applySavedTheme();
    UI.renderHistory();
    UI.renderFavorites();
    this.updateFavBtnState();

    // Evento do botão de busca
    dom.searchBtn.addEventListener("click", () => {
      const city = dom.cityInput.value.trim();
      if (!UI.isValidCityInput(city)) {
        UI.showToast("Por favor, informe uma cidade válida.");
        return;
      }
      this.handleCitySelect(city);
    });

    // Permite buscar com Enter no input
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

    // Ao digitar, invalida a última cidade válida e atualiza o estado do botão favorito
    dom.cityInput.addEventListener("input", () => {
      currentCityValid = false;
      this.updateFavBtnState();
    });

    // Botão de adicionar favorito
    dom.favBtn.addEventListener("click", () => {
      const city = dom.cityInput.value.trim();
      if (!city) return;
      this.addFavorite(city);
    });

    // Botão para alternar tema
    dom.themeToggle.addEventListener("click", () => UI.toggleThemeColors());

    // Facilita seleção do texto no input ao focar
    dom.cityInput.addEventListener('focus', e => e.target.select());
    dom.cityInput.addEventListener('mouseup', e => e.preventDefault());

    // Ao carregar, tenta restaurar último clima buscado ou usar geolocalização, ou fallback para cidade padrão
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

// Inicializa app após carregamento da página
window.onload = () => App.init();
