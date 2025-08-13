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
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
  document.getElementById("city-input").focus();
}

function setLoadingState(isLoading) {
  const loadingEl = document.getElementById("loading");
  const weatherCard = document.getElementById("weather-card");

  if (isLoading) {
    weatherCard.classList.remove("hidden");
    loadingEl.classList.remove("hidden");
  } else {
    loadingEl.classList.add("hidden");
  }
}

// ==========================
// Renderização
// ==========================
function renderHistory() {
  const historyContainer = document.getElementById("history-list");
  historyContainer.innerHTML = "";
  historyList.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.addEventListener("click", () => handleCitySelect(city));
    historyContainer.appendChild(li);
  });
}

function renderFavorites() {
  const favoritesContainer = document.getElementById("favorites-list");
  favoritesContainer.innerHTML = "";
  favorites.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.addEventListener("click", () => handleCitySelect(city));
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showConfirmationModal(`Remover ${city} dos favoritos?`, () => {
        favorites = favorites.filter(fav => fav !== city);
        saveToLocalStorage("favorites", favorites);
        renderFavorites();
        updateButtonsState(city);
      });
    });
    li.appendChild(removeBtn);
    favoritesContainer.appendChild(li);
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
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoadingState(false);
  }
}

function renderWeather(data) {
  const cityEl = document.getElementById("city");
  const tempEl = document.getElementById("temperature");
  const descEl = document.getElementById("description");
  cityEl.textContent = data.name;
  tempEl.textContent = `${Math.round(data.main.temp)}°C`;
  descEl.textContent = data.weather[0].description;
}

function updateHistory(city) {
  const capCity = capitalizeCityName(city);
  historyList = [capCity, ...historyList.filter(c => c !== capCity)].slice(0, maxHistoryItems);
  saveToLocalStorage("history", historyList);
  renderHistory();
}

function updateButtonsState(cityName) {
  const addFavBtn = document.getElementById("add-favorite");
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
// Modal
// ==========================
function showConfirmationModal(message, onConfirm) {
  const modal = document.getElementById("confirmation-modal");
  const msg = document.getElementById("modal-message");
  const confirmBtn = document.getElementById("confirm-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  msg.textContent = message;
  modal.classList.remove("hidden");

  const cleanup = () => {
    modal.classList.add("hidden");
    confirmBtn.removeEventListener("click", confirmHandler);
    cancelBtn.removeEventListener("click", cancelHandler);
    document.removeEventListener("keydown", escHandler);
    modal.removeEventListener("click", outsideHandler);
  };

  const confirmHandler = () => {
    onConfirm();
    cleanup();
  };
  const cancelHandler = cleanup;
  const escHandler = (e) => { if (e.key === "Escape") cleanup(); };
  const outsideHandler = (e) => { if (e.target === modal) cleanup(); };

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
    setLoadingState(true); // Mostra spinner e card desde o início

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
          fetchWeather(coords);
        },
        () => handleCitySelect("São Miguel do Oeste")
      );
    } else {
      handleCitySelect("São Miguel do Oeste");
    }
  }
};

window.onload = () => App.init();
