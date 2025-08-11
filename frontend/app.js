(() => {
  "use strict";

  // --- Configurações ---
  const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

  // --- DOM Elements ---
  const body = document.body;
  const themeToggleBtn = document.getElementById("theme-toggle");
  const cityInput = document.getElementById("city-input");
  const searchBtn = document.getElementById("search-btn");
  const favBtn = document.getElementById("fav-btn");
  const weatherSection = document.getElementById("weather");
  const iconEl = document.getElementById("icon");
  const cityNameEl = document.getElementById("city-name");
  const tempEl = document.getElementById("temp");
  const descEl = document.getElementById("desc");
  const detailsEl = document.getElementById("details");
  const spinner = document.getElementById("spinner");
  const errorMessage = document.getElementById("error-message");
  const historyList = document.getElementById("history-list");
  const favoritesList = document.getElementById("favorites-list");
  const toast = document.getElementById("toast");

  // --- Estado ---
  let currentTheme = localStorage.getItem("theme") || "light";
  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  let history = JSON.parse(localStorage.getItem("history") || "[]");
  let lastCity = null;

  // --- Funções Auxiliares ---

  function setTheme(theme) {
    currentTheme = theme;
    body.classList.remove("light", "dark");
    body.classList.add(theme);
    themeToggleBtn.textContent = theme === "light" ? "Modo Escuro" : "Modo Claro";
    themeToggleBtn.setAttribute("aria-pressed", theme === "dark");
    localStorage.setItem("theme", theme);
    if (lastCity) {
      applyBackground(lastCity.weather[0].main);
    }
  }

  function applyBackground(weatherMain) {
    const weatherKey = weatherMain.toLowerCase();
    const validWeathers = ["clear", "clouds", "rain", "thunderstorm", "snow"];
    const key = validWeathers.includes(weatherKey) ? weatherKey : "clear";
    body.classList.remove(
      "bg-clear",
      "bg-clouds",
      "bg-rain",
      "bg-thunderstorm",
      "bg-snow"
    );
    body.classList.add(`bg-${key}`);
  }

  function showSpinner(show) {
    if (show) {
      spinner.style.display = "block";
      weatherSection.classList.add("loading");
    } else {
      spinner.style.display = "none";
      weatherSection.classList.remove("loading");
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = "block";
    errorMessage.focus();
    weatherSection.hidden = true;
  }

  function clearError() {
    errorMessage.style.display = "none";
    errorMessage.textContent = "";
  }

  function showToast(msg, duration = 2000) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  function formatTemperature(kelvin) {
    return `${Math.round(kelvin - 273.15)}°C`;
  }

  function formatDetails(weather) {
    return `
      Sensação térmica: ${formatTemperature(weather.feels_like)}<br>
      Umidade: ${weather.humidity}%<br>
      Vento: ${Math.round(weather.wind_speed)} m/s
    `;
  }

  function updateWeatherUI(data) {
    clearError();
    const weather = data.weather[0];
    const main = data.main;
    const wind = data.wind;

    lastCity = data;

    cityNameEl.textContent = data.name;
    tempEl.textContent = formatTemperature(main.temp);
    descEl.textContent = weather.description;
    detailsEl.innerHTML = formatDetails({
      feels_like: main.feels_like,
      humidity: main.humidity,
      wind_speed: wind.speed,
    });

    // Atualiza ícone com classe correta
    iconEl.className = `weather-icon ${weather.main.toLowerCase()}`;

    // Exibe seção de clima
    weatherSection.hidden = false;

    // Aplica fundo de acordo com clima e tema
    applyBackground(weather.main);
  }

  // --- Histórico e Favoritos ---

  function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  function saveHistory() {
    localStorage.setItem("history", JSON.stringify(history));
  }

  function renderList(listElement, items, onClick, isFavorites = false) {
    listElement.innerHTML = "";
    if (items.length === 0) {
      listElement.innerHTML = `<li aria-disabled="true" style="opacity:0.6;">Nenhum item</li>`;
      return;
    }
    items.forEach((city) => {
      const li = document.createElement("li");
      li.textContent = city;
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-label", `${city}, clique para ver o clima`);
      li.addEventListener("click", () => onClick(city));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(city);
        }
      });

      if (isFavorites) {
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "×";
        removeBtn.className = "remove-fav-btn";
        removeBtn.setAttribute("aria-label", `Remover ${city} dos favoritos`);
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removeFavorite(city);
        });
        li.appendChild(removeBtn);
      }

      listElement.appendChild(li);
    });
  }

  function addFavorite(city) {
    if (!favorites.includes(city)) {
      favorites.push(city);
      saveFavorites();
      renderFavorites();
      showToast(`${city} adicionado aos favoritos.`);
    } else {
      showToast(`${city} já está nos favoritos.`);
    }
  }

  function removeFavorite(city) {
    favorites = favorites.filter((fav) => fav !== city);
    saveFavorites();
    renderFavorites();
    showToast(`${city} removido dos favoritos.`);
  }

  function renderFavorites() {
    renderList(favoritesList, favorites, (city) => fetchWeather(city), true);
  }

  function addHistory(city) {
    history = history.filter((c) => c !== city);
    history.unshift(city);
    if (history.length > 10) history.pop();
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    renderList(historyList, history, (city) => fetchWeather(city));
  }

  // --- API ---

  async function fetchWeather(city) {
    if (!city || city.trim() === "") {
      showError("Por favor, digite o nome de uma cidade.");
      return;
    }

    clearError();
    showSpinner(true);
    searchBtn.disabled = true;
    favBtn.disabled = true;

    try {
      const url = `${backendUrl}?city=${encodeURIComponent(city.trim())}&days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Cidade não encontrada ou erro na API.");
      const data = await res.json();

      updateWeatherUI(data);
      addHistory(data.name);

      // Se cidade está nos favoritos, ativa o botão
      favBtn.disabled = false;
    } catch (error) {
      showError(error.message || "Erro ao buscar o clima.");
      favBtn.disabled = true;
      weatherSection.hidden = true;
    } finally {
      showSpinner(false);
      searchBtn.disabled = false;
    }
  }

  // --- Eventos ---

  searchBtn.addEventListener("click", () => {
    fetchWeather(cityInput.value);
  });

  cityInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      fetchWeather(cityInput.value);
    }
  });

  favBtn.addEventListener("click", () => {
    if (lastCity) {
      addFavorite(lastCity.name);
    }
  });

  themeToggleBtn.addEventListener("click", () => {
    setTheme(currentTheme === "light" ? "dark" : "light");
  });

  // --- Inicialização ---

  function init() {
    setTheme(currentTheme);
    renderFavorites();
    renderHistory();
    if (history.length > 0) {
      fetchWeather(history[0]);
    }
  }

  init();
})();
