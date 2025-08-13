// ==========================
// Configurações iniciais
// ==========================
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;
const maxFavorites = 5;

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let historyList = JSON.parse(localStorage.getItem("history")) || [];

// ==========================
// Funções auxiliares
// ==========================
function capitalizeCityName(city) {
  return city
    .toLowerCase()
    .split(" ")
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function saveToLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
  const cityInput = document.getElementById("city-input");
  if (cityInput) cityInput.focus();
}

function setLoadingState(isLoading) {
  const weatherCard = document.getElementById("weather");
  const spinner = document.getElementById("spinner");
  if (!weatherCard || !spinner) return;
  if (isLoading) {
    weatherCard.classList.add("loading");
    spinner.style.display = "block";
  } else {
    weatherCard.classList.remove("loading");
    spinner.style.display = "none";
  }
}

// ==========================
// Renderização
// ==========================
function renderHistory() {
  const container = document.getElementById("history-list");
  if (!container) return;
  container.innerHTML = "";
  historyList.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener("click", () => handleCitySelect(city));
    container.appendChild(li);
  });
}

function renderFavorites() {
  const container = document.getElementById("favorites-list");
  if (!container) return;
  container.innerHTML = "";
  favorites.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener("click", () => handleCitySelect(city));

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.className = "remove-fav-btn";
    removeBtn.addEventListener("click", e => {
      e.stopPropagation();
      showConfirmationModal(`Remover ${city} dos favoritos?`, () => {
        favorites = favorites.filter(fav => fav !== city);
        saveToLocalStorage("favorites", favorites);
        renderFavorites();
        updateButtonsState(city);
        showToast(`${city} removida dos favoritos`);
      });
    });

    li.appendChild(removeBtn);
    container.appendChild(li);
  });
}

// ==========================
// Lógica principal
// ==========================
async function fetchWeather(query) {
  try {
    setLoadingState(true);
    const response = await fetch(`${backendUrl}?city=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Falha ao obter clima.");
    const data = await response.json();
    renderWeather(data);
    updateHistory(data.name);
    updateButtonsState(data.name);
  } catch (err) {
    showToast(err.message);
  } finally {
    setLoadingState(false);
  }
}

function renderWeather(data) {
  const cityEl = document.getElementById("city-name");
  const tempEl = document.getElementById("temp");
  const descEl = document.getElementById("desc");
  const iconEl = document.getElementById("icon");

  if (cityEl) cityEl.textContent = data.name;
  if (tempEl) tempEl.textContent = `${Math.round(data.main.temp)}°C`;
  if (descEl) descEl.textContent = data.weather[0].description;

  if (iconEl) {
    iconEl.className = "weather-icon";
    const main = data.weather[0].main.toLowerCase();
    if (main.includes("cloud")) iconEl.classList.add("clouds");
    else if (main.includes("rain")) iconEl.classList.add("rain");
    else if (main.includes("thunder")) iconEl.classList.add("thunderstorm");
    else if (main.includes("snow")) iconEl.classList.add("snow");
    else iconEl.classList.add("clear");
  }
}

function updateHistory(city) {
  const capCity = capitalizeCityName(city);
  historyList = [capCity, ...historyList.filter(c => c !== capCity)].slice(0, maxHistoryItems);
  saveToLocalStorage("history", historyList);
  renderHistory();
}

function updateButtonsState(cityName) {
  const addFavBtn = document.getElementById("fav-btn");
  if (!addFavBtn) return;
  if (!cityName) {
    addFavBtn.disabled = true;
    return;
  }
  const inFavorites = favorites.includes(cityName);
  addFavBtn.disabled = inFavorites || favorites.length >= maxFavorites;
  addFavBtn.onclick = () => {
    if (!inFavorites && favorites.length < maxFavorites) {
      favorites.push(cityName);
      saveToLocalStorage("favorites", favorites);
      renderFavorites();
      updateButtonsState(cityName);
      showToast(`${cityName} adicionada aos favoritos`);
    }
  };
}

function handleCitySelect(city) {
  fetchWeather(city);
}

// ==========================
// Tema
// ==========================
function applySavedTheme() {
  const theme = localStorage.getItem("theme");
  if (theme === "dark") {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
  } else {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
  }
}

// ==========================
// Modal de confirmação
// ==========================
function showConfirmationModal(message, onConfirm) {
  const modal = document.getElementById("confirm-modal");
  if (!modal) return;

  modal.querySelector("p").textContent = message;
  modal.hidden = false;
  modal.classList.add("show");

  const confirmBtn = document.getElementById("confirm-yes");
  const cancelBtn = document.getElementById("confirm-no");

  const cleanup = () => {
    modal.hidden = true;
    modal.classList.remove("show");
    confirmBtn.removeEventListener("click", confirmHandler);
    cancelBtn.removeEventListener("click", cancelHandler);
    document.removeEventListener("keydown", escHandler);
    modal.removeEventListener("click", outsideHandler);
  };

  const confirmHandler = () => { onConfirm(); cleanup(); };
  const cancelHandler = cleanup;
  const escHandler = e => { if (e.key === "Escape") cleanup(); };
  const outsideHandler = e => { if (e.target === modal) cleanup(); };

  confirmBtn.addEventListener("click", confirmHandler);
  cancelBtn.addEventListener("click", cancelHandler);
  document.addEventListener("keydown", escHandler);
  modal.addEventListener("click", outsideHandler);
}

// ==========================
// Inicialização
// ==========================
const App = {
  init() {
    applySavedTheme();
    renderFavorites();
    renderHistory();

    setLoadingState(true);

    const cityInput = document.getElementById("city-input");
    const searchBtn = document.getElementById("search-btn");
    if (cityInput && searchBtn) {
      cityInput.addEventListener("input", () => {
        const hasText = cityInput.value.trim().length > 0;
        searchBtn.disabled = !hasText;
        updateButtonsState(cityInput.value);
      });

      searchBtn.addEventListener("click", e => {
        e.preventDefault();
        handleCitySelect(cityInput.value.trim());
      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(`${pos.coords.latitude},${pos.coords.longitude}`),
        () => handleCitySelect("São Miguel do Oeste")
      );
    } else {
      handleCitySelect("São Miguel do Oeste");
    }

    // Toggle tema
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        document.body.classList.toggle("light");
        const theme = document.body.classList.contains("dark") ? "dark" : "light";
        localStorage.setItem("theme", theme);
      });
    }
  }
};

window.onload = () => App.init();
