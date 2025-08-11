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
const errorMessage = document.getElementById("error-message");

const historyList = document.getElementById("history-list");
const favoritesList = document.getElementById("favorites-list");

let history = JSON.parse(localStorage.getItem("history")) || [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

let currentTheme = localStorage.getItem("theme") || "light";

document.body.classList.add(currentTheme);

function setTheme(theme) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);
  localStorage.setItem("theme", theme);
  currentTheme = theme;
  updateThemeToggleText();
}

function updateThemeToggleText() {
  themeToggle.textContent = currentTheme === "light" ? "Modo Escuro" : "Modo Claro";
}

themeToggle.addEventListener("click", () => {
  setTheme(currentTheme === "light" ? "dark" : "light");
});

updateThemeToggleText();

function showSpinner() {
  spinner.style.display = "block";
  spinner.removeAttribute("hidden");
  weatherDiv.classList.add("loading");
}

function hideSpinner() {
  spinner.style.display = "none";
  spinner.setAttribute("hidden", "");
  weatherDiv.classList.remove("loading");
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.removeAttribute("hidden");
  // Remove visual do painel de clima
  weatherDiv.hidden = true;
}

function hideError() {
  errorMessage.setAttribute("hidden", "");
}

function updateBackgroundByWeather(main) {
  const mainLower = main.toLowerCase();
  const validWeathers = ["clear", "clouds", "rain", "thunderstorm", "snow"];
  let weatherClass = validWeathers.includes(mainLower) ? mainLower : "clear";

  document.body.classList.remove(...validWeathers.map(w => `bg-${w}`));
  document.body.classList.add(`bg-${weatherClass}`);
}

function renderWeather(data) {
  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  tempEl.textContent = `${Math.round(data.main.temp)}°C`;
  descEl.textContent = data.weather[0].description;
  detailsEl.innerHTML = `
    Sensação térmica: ${Math.round(data.main.feels_like)}°C<br/>
    Umidade: ${data.main.humidity}%<br/>
    Vento: ${Math.round(data.wind.speed)} m/s
  `;

  iconEl.className = "weather-icon";
  const weatherMain = data.weather[0].main.toLowerCase();
  iconEl.classList.add(weatherMain);

  updateBackgroundByWeather(data.weather[0].main);

  weatherDiv.hidden = false; // Mostrar o card clima
  hideSpinner();
  hideError();
}

function saveHistory(city) {
  city = city.trim();
  if (!city) return;
  if (!history.includes(city)) {
    history.unshift(city);
    if (history.length > 10) history.pop();
    localStorage.setItem("history", JSON.stringify(history));
    renderHistory();
  }
}

function saveFavorite(city) {
  city = city.trim();
  if (!city) return;
  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavorites();
    showToast(`Adicionado "${city}" aos favoritos.`);
  }
}

function removeFavorite(city) {
  city = city.trim();
  favorites = favorites.filter(fav => fav !== city);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
  showToast(`Removido "${city}" dos favoritos.`);
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.setAttribute("tabindex", "0");
    li.setAttribute("role", "button");
    li.addEventListener("click", () => {
      cityInput.value = city;
      fetchWeather(city);
    });
    li.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cityInput.value = city;
        fetchWeather(city);
      }
    });
    historyList.appendChild(li);
  });
}

function renderFavorites() {
  favoritesList.innerHTML = "";
  favorites.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.setAttribute("tabindex", "0");
    li.setAttribute("role", "button");

    li.addEventListener("click", () => {
      cityInput.value = city;
      fetchWeather(city);
    });

    li.addEventListener("keydown", e => {
      if (
        ["Delete", "Backspace", "Escape"].includes(e.key) ||
        (e.key === "Enter" && e.shiftKey)
      ) {
        e.preventDefault();
        removeFavorite(city);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cityInput.value = city;
        fetchWeather(city);
      }
    });

    // Botão remover favorito
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.title = `Remover ${city} dos favoritos`;
    removeBtn.setAttribute("role", "button");
    removeBtn.setAttribute("aria-label", `Remover ${city} dos favoritos`);
    removeBtn.setAttribute("tabindex", "0");
    removeBtn.classList.add("remove-fav-btn");

    removeBtn.addEventListener("click", e => {
      e.stopPropagation();
      removeFavorite(city);
    });

    li.appendChild(removeBtn);
    favoritesList.appendChild(li);
  });
}

async function fetchWeather(city) {
  city = city.trim();
  if (!city) return;

  showSpinner();
  hideError();
  searchBtn.disabled = true;
  favBtn.disabled = true;

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=5`);
    if (!res.ok) throw new Error("Erro ao buscar dados do clima.");
    const data = await res.json();
    if (!data || !data.weather) throw new Error("Dados de clima inválidos.");

    renderWeather(data);
    saveHistory(city);
  } catch (err) {
    showError(err.message);
    hideSpinner();
  } finally {
    searchBtn.disabled = false;
    favBtn.disabled = false;
  }
}

searchBtn.addEventListener("click", () => {
  fetchWeather(cityInput.value);
});

favBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city && !favorites.includes(city)) {
    saveFavorite(city);
  }
});

cityInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    fetchWeather(cityInput.value);
  }
});

renderHistory();
renderFavorites();

// Função para mostrar toast
const toast = document.getElementById("toast");
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.pointerEvents = "auto";

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.pointerEvents = "none";
  }, 3000);
}
