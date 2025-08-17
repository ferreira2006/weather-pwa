// =======================================================
// CONFIGURAÇÕES INICIAIS
// =======================================================
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

// =======================================================
// UTILITÁRIOS
// =======================================================
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  },
  showToast(message, duration = 3000) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
  },
};

// =======================================================
// ELEMENTOS DO DOM
// =======================================================
const body = document.body;
const themeToggleBtn = document.getElementById("theme-toggle");
const stateSelect = document.getElementById("state-select");
const citySelect = document.getElementById("city-select");
const stateCityBtn = document.getElementById("state-city-search-btn");
const searchBtn = document.getElementById("search-btn");
const weatherCard = document.getElementById("weather");
const weatherIcon = document.getElementById("icon");
const cityNameEl = document.getElementById("city-name");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const detailsEl = document.getElementById("details");
const weatherError = document.getElementById("weather-error");
const spinner = document.getElementById("spinner");
const favBtn = document.getElementById("fav-btn");
const favIcon = document.getElementById("weather-fav-icon");
const historyList = document.getElementById("history-list");
const favoritesList = document.getElementById("favorites-list");
const confirmModal = document.getElementById("confirm-modal");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");
const scrollTopBtn = document.getElementById("scroll-top-btn");

// =======================================================
// ESTADOS LOCAIS
// =======================================================
let history = [];
let favorites = [];
let currentCity = null;
let cityToRemove = null;

// =======================================================
// FUNÇÕES DE TEMA
// =======================================================
function toggleTheme() {
  if (body.classList.contains("light")) {
    body.classList.replace("light", "dark");
    themeToggleBtn.textContent = "Modo Claro";
    themeToggleBtn.setAttribute("aria-pressed", "true");
  } else {
    body.classList.replace("dark", "light");
    themeToggleBtn.textContent = "Modo Escuro";
    themeToggleBtn.setAttribute("aria-pressed", "false");
  }
}
themeToggleBtn.addEventListener("click", toggleTheme);

// =======================================================
// FUNÇÕES DE SPINNER E LOADING
// =======================================================
function setLoading(loading) {
  if (loading) {
    weatherCard.classList.add("loading");
  } else {
    weatherCard.classList.remove("loading");
  }
}

// =======================================================
// FUNÇÕES DE HISTÓRICO
// =======================================================
function addToHistory(city) {
  history = history.filter(c => c !== city);
  history.unshift(city);
  if (history.length > maxHistoryItems) history.pop();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener("click", () => fetchWeather(city));
    historyList.appendChild(li);
  });
}

// =======================================================
// FUNÇÕES DE FAVORITOS
// =======================================================
function toggleFavorite() {
  if (!currentCity) return;
  if (favorites.includes(currentCity)) {
    cityToRemove = currentCity;
    openModal();
  } else {
    favorites.push(currentCity);
    updateFavUI(true);
    renderFavorites();
    Utils.showToast(`${currentCity} adicionado aos favoritos!`);
  }
}

function updateFavUI(favorited) {
  favIcon.classList.toggle("favorited", favorited);
  favIcon.classList.toggle("not-favorited", !favorited);
}

function renderFavorites() {
  favoritesList.innerHTML = "";
  favorites.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener("click", () => fetchWeather(city));
    favoritesList.appendChild(li);
  });
}

// =======================================================
// FUNÇÕES DE MODAL
// =======================================================
function openModal() {
  confirmModal.hidden = false;
}

function closeModal() {
  confirmModal.hidden = true;
}

confirmYes.addEventListener("click", () => {
  favorites = favorites.filter(c => c !== cityToRemove);
  if (currentCity === cityToRemove) updateFavUI(false);
  renderFavorites();
  closeModal();
  Utils.showToast(`${cityToRemove} removido dos favoritos.`);
  cityToRemove = null;
});

confirmNo.addEventListener("click", closeModal);

// =======================================================
// FUNÇÕES DE CLIMA
// =======================================================
async function fetchWeather(city) {
  if (!city) return;
  setLoading(true);
  weatherError.textContent = "";
  weatherError.style.display = "none";
  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();
    displayWeather(data);
    addToHistory(Utils.capitalizeCityName(city));
  } catch (err) {
    weatherError.textContent = err.message;
    weatherError.style.display = "block";
    weatherCard.focus();
  } finally {
    setLoading(false);
  }
}

function displayWeather(data) {
  currentCity = Utils.capitalizeCityName(data.name);
  cityNameEl.textContent = currentCity;
  tempEl.textContent = `${Math.round(data.main.temp)}°C`;
  descEl.textContent = data.weather[0].description;
  detailsEl.textContent = `Umidade: ${data.main.humidity}% | Vento: ${data.wind.speed} m/s`;

  // Atualiza ícone do clima
  const condition = data.weather[0].main.toLowerCase();
  weatherIcon.className = `weather-icon ${condition}`;

  // Atualiza tema de fundo do body
  const themeClass = body.classList.contains("light") ? "light" : "dark";
  body.className = `${themeClass} bg-${condition}`;

  // Atualiza favoritos
  updateFavUI(favorites.includes(currentCity));
}

// =======================================================
// EVENTOS DE FAVORITOS
// =======================================================
favBtn.addEventListener("click", toggleFavorite);

// =======================================================
// EVENTO DE SCROLL TOP
// =======================================================
window.addEventListener("scroll", () => {
  scrollTopBtn.style.display = window.scrollY > 300 ? "flex" : "none";
});
scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// =======================================================
// INICIALIZAÇÃO
// =======================================================
function init() {
  // Carregar histórico e favoritos do localStorage se quiser
  // Ex: history = JSON.parse(localStorage.getItem("history")) || [];
  // Ex: favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  renderHistory();
  renderFavorites();
  // Busca inicial pode ser geolocalização ou cidade padrão
}

init();
