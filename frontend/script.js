const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const favBtn = document.getElementById("fav-btn");
const themeToggle = document.getElementById("theme-toggle");

const weatherDiv = document.getElementById("weather");
const cityNameEl = document.getElementById("city-name");
const iconEl = document.getElementById("icon");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const detailsEl = document.getElementById("details");
const spinner = document.getElementById("spinner");
const errorMessageDiv = document.getElementById("error-message");

const historyListEl = document.getElementById("history-list");
const favoritesListEl = document.getElementById("favorites-list");

const toast = document.getElementById("toast");
const maxHistoryItems = 5;

// --- BACKGROUND DINÂMICO POR CLIMA ---
function setDynamicBackground(mainWeather) {
  const classes = [
    "bg-clear",
    "bg-clouds",
    "bg-rain",
    "bg-thunderstorm",
    "bg-snow",
  ];
  document.body.classList.remove(...classes);

  mainWeather = mainWeather.toLowerCase();
  let weatherKey = "clear";
  if (mainWeather.includes("clear")) weatherKey = "clear";
  else if (mainWeather.includes("cloud")) weatherKey = "clouds";
  else if (mainWeather.includes("rain") || mainWeather.includes("drizzle"))
    weatherKey = "rain";
  else if (mainWeather.includes("thunderstorm")) weatherKey = "thunderstorm";
  else if (mainWeather.includes("snow")) weatherKey = "snow";

  document.body.classList.add(bg-${weatherKey});
}

function showToast(message, duration = 3000) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// --- TEMAS ---
function updateThemeColors() {
  const rootStyles = getComputedStyle(document.documentElement);
  const isDark = document.body.classList.contains("dark");

  cityInput.style.color = isDark
    ? rootStyles.getPropertyValue("--input-text-dark").trim()
    : rootStyles.getPropertyValue("--input-text-light").trim();
  cityInput.style.backgroundColor = isDark
    ? rootStyles.getPropertyValue("--input-bg-dark").trim()
    : rootStyles.getPropertyValue("--input-bg-light").trim();

  const buttonBg = rootStyles.getPropertyValue("--button-bg").trim();

  [searchBtn, favBtn].forEach((btn) => {
    btn.style.backgroundColor = buttonBg;
    btn.style.color = isDark ? "#ddd" : "#fff";
  });

  [...historyListEl.children, ...(favoritesListEl ? [...favoritesListEl.children] : [])].forEach(
    (li) => {
      li.style.backgroundColor = buttonBg;
      li.style.color = isDark ? "#ddd" : "#fff";
    }
  );

  detailsEl.style.color = isDark ? "#ddd" : "#000";

  errorMessageDiv.style.color = isDark ? "#ffbaba" : "#b00000";
  errorMessageDiv.style.backgroundColor = isDark ? "#5c0000" : "#ffdede";

  themeToggle.style.color = isDark ? "#ddd" : "#000";
  themeToggle.style.borderColor = isDark ? "#ddd" : "#000";
}

function updateThemeToggleButton() {
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "Modo Claro" : "Modo Escuro";
  themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
}

function applySavedTheme() {
  const saved = localStorage.getItem("theme");
  document.body.classList.toggle("dark", saved === "dark");
  document.body.classList.toggle("light", saved !== "dark");
  updateThemeColors();
  updateThemeToggleButton();
  setDynamicBackgroundFromCurrentIcon();
}

function toggleTheme() {
  const isLight = document.body.classList.contains("light");
  document.body.classList.toggle("dark", isLight);
  document.body.classList.toggle("light", !isLight);
  localStorage.setItem("theme", isLight ? "dark" : "light");
  updateThemeColors();
  updateThemeToggleButton();
  setDynamicBackgroundFromCurrentIcon();
}

// --- UTILITÁRIOS ---
function setDynamicBackgroundFromCurrentIcon() {
  if (weatherDiv.style.display !== "none") {
    const mainClass = [...iconEl.classList].find((c) => c !== "weather-icon");
    setDynamicBackground(mainClass || "clear");
  } else {
    setDynamicBackground("clear");
  }
}

// --- MOSTRAR CLIMA ---
function showWeather(data) {
  errorMessageDiv.style.display = "none";

  cityNameEl.textContent = ${data.name}, ${data.sys.country};
  tempEl.textContent = ${Math.round(data.main.temp)}ºC;
  descEl.textContent = data.weather[0].description;

  detailsEl.innerHTML = 
    Sensação: ${Math.round(data.main.feels_like)}ºC<br/>
    Umidade: ${data.main.humidity}%<br/>
    Vento: ${data.wind.speed} m/s
  ;

  const mainWeather = data.weather[0].main.toLowerCase();
  iconEl.className = "weather-icon"; // limpa classes
  if (mainWeather.includes("clear")) iconEl.classList.add("clear");
  else if (mainWeather.includes("cloud")) iconEl.classList.add("clouds");
  else if (mainWeather.includes("rain") || mainWeather.includes("drizzle"))
    iconEl.classList.add("rain");
  else if (mainWeather.includes("thunderstorm"))
    iconEl.classList.add("thunderstorm");
  else if (mainWeather.includes("snow")) iconEl.classList.add("snow");
  else iconEl.classList.add("clear");

  setDynamicBackground(mainWeather);
  updateThemeColors();

  weatherDiv.style.display = "grid";
  weatherDiv.focus();
}

// --- ERRO ---
function showError(message) {
  weatherDiv.style.display = "none";
  errorMessageDiv.textContent = message;
  errorMessageDiv.style.display = "block";
  errorMessageDiv.focus();
}

// --- FETCH CLIMA ---
async function fetchWeather(city) {
spinner.style.display = "block";
  searchBtn.disabled = true;
  favBtn.disabled = true;  // Desabilita no começo
  errorMessageDiv.style.display = "none";

  try {
    const res = await fetch(
      ${backendUrl}?city=${encodeURIComponent(city)}&days=1
    );
    if (!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();

    // Se deu certo, habilita o botão de favorito
    favBtn.disabled = false;

    return data;
  } catch (err) {
    // Em caso de erro, mantém desabilitado
    favBtn.disabled = true;
    throw err;
  } finally {
    spinner.style.display = "none";
    searchBtn.disabled = false;
  }
}

async function fetchByCoords(lat, lon) {
  spinner.style.display = "block";
  searchBtn.disabled = true;
  favBtn.disabled = true;
  errorMessageDiv.style.display = "none";

  try {
    const res = await fetch(${backendUrl}?lat=${lat}&lon=${lon}&days=1);
    if (!res.ok)
      throw new Error("Não foi possível obter o clima para sua localização.");
    const data = await res.json();
    showWeather(data);
    saveHistory(data.name);
    renderHistory();
  } catch (err) {
    showError(err.message);
  } finally {
    spinner.style.display = "none";
    searchBtn.disabled = false;
    updateFavBtnState();
  }
}

// --- HISTÓRICO ---
function getHistory() {
  return JSON.parse(localStorage.getItem("weatherHistory")) || [];
}

function saveHistory(city) {
  let history = getHistory();
  history = history.filter((c) => c.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  if (history.length > maxHistoryItems) history = history.slice(0, maxHistoryItems);
  localStorage.setItem("weatherHistory", JSON.stringify(history));
}

function renderHistory() {
  const history = getHistory();
  historyListEl.innerHTML = "";
  history.forEach((city) => {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.textContent = city;
    li.addEventListener("click", () => handleCitySelect(city));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCitySelect(city);
      }
    });
    historyListEl.appendChild(li);
  });
  updateThemeColors();
}

// --- FAVORITOS ---
function getFavorites() {
  return JSON.parse(localStorage.getItem("weatherFavorites")) || [];
}

function saveFavorites(favorites) {
  localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
}

function addFavorite(city) {
  let favorites = getFavorites();
  if (favorites.some((c) => c.toLowerCase() === city.toLowerCase())) {
    showToast("${city}" já está nos favoritos.);
    return;
  }
  favorites.push(city);
  saveFavorites(favorites);
  renderFavorites();
  showToast("${city}" adicionado aos favoritos!);
}

function removeFavorite(city) {
  let favorites = getFavorites();
  favorites = favorites.filter((c) => c.toLowerCase() !== city.toLowerCase());
  saveFavorites(favorites);
  renderFavorites();
  showToast("${city}" removido dos favoritos.);
}

function renderFavorites() {
  const favorites = getFavorites();
  favoritesListEl.innerHTML = "";

  favorites.forEach((city) => {
    const li = document.createElement("li");
    li.tabIndex = 0;

    const citySpan = document.createElement("span");
    citySpan.textContent = city;
    citySpan.style.cursor = "pointer";
    citySpan.title = "Clique para buscar";
    citySpan.addEventListener("click", () => handleCitySelect(city));

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.title = Remover ${city} dos favoritos;
    removeBtn.setAttribute("role", "button");
    removeBtn.setAttribute("aria-label", Remover ${city} dos favoritos);
    removeBtn.setAttribute("tabindex", "0");
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

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFavorite(city);
    });

    li.addEventListener("keydown", (e) => {
      if (
        ["Delete", "Backspace"].includes(e.key) ||
        (e.key === "Enter" && e.shiftKey)
      ) {
        e.preventDefault();
        removeFavorite(city);
      }
    });

    li.title =
      "Clique para buscar. Pressione Shift+Enter ou Delete para remover dos favoritos.";

    li.appendChild(citySpan);
    li.appendChild(removeBtn);
    favoritesListEl.appendChild(li);
  });

  updateThemeColors();
}

// --- AÇÃO DE BUSCAR CIDADE ---
async function handleCitySelect(city) {
  cityInput.value = city;
  try {
    const data = await fetchWeather(city);
    showWeather(data);
    saveHistory(city);
    renderHistory();
    localStorage.setItem("lastCity", city);
  } catch (err) {
    showError(err.message || "Erro ao buscar o clima");
  }
}

// --- Atualiza o estado do botão Favoritos ---
function updateFavBtnState() {
  const city = cityInput.value.trim().toLowerCase();
  const favorites = getFavorites().map(fav => fav.toLowerCase());

  favBtn.disabled = 
    city === "" || 
    searchBtn.disabled || 
    favorites.includes(city);
}

// --- EVENTOS ---
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) handleCitySelect(city);
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchBtn.click();
  }
});

cityInput.addEventListener("input", updateFavBtnState);

cityInput.addEventListener("input", () => {
  // Só ativa o botão se o input não estiver vazio e o botão não estiver desabilitado por erro
  if (cityInput.value.trim() === "" || searchBtn.disabled) {
    favBtn.disabled = true;
  } else {
    // Para ativar só se a busca foi validada, a lógica ficará no fetchWeather.
  }
});

async function handleAddFavorite() {
  const city = cityInput.value.trim();
  if (!city) return;

  try {
    const data = await fetchWeather(city);
    if (data && data.name) {
      addFavorite(data.name);
    } else {
      showToast(Cidade "${city}" não encontrada. Não pode adicionar aos favoritos.);
    }
  } catch (error) {
    showToast(Erro ao buscar cidade "${city}". Não pode adicionar aos favoritos.);
  }
}

favBtn.addEventListener("click", handleAddFavorite);

themeToggle.addEventListener("click", toggleTheme);

cityInput.addEventListener("focus", (e) => e.target.select());
cityInput.addEventListener("mouseup", (e) => e.preventDefault());

// --- INICIALIZAÇÃO ---
window.onload = () => {
  applySavedTheme();
  renderHistory();
  renderFavorites();
  updateFavBtnState();
  updateFavBtnState();

  const lastCity = localStorage.getItem("lastCity");

  if (lastCity) {
    handleCitySelect(lastCity);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => handleCitySelect("São Miguel do Oeste")
    );
  } else {
    handleCitySelect("São Miguel do Oeste");
  }
};
