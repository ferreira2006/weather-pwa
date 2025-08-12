const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const maxHistoryItems = 5;

// Capitaliza nome da cidade (ex: "rio de janeiro" => "Rio De Janeiro")
function capitalizeCityName(city) {
  return city
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

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

// ... (restante do seu código)

const Storage = {
  getHistory() {
    return JSON.parse(localStorage.getItem("weatherHistory")) || [];
  },

  saveHistory(city) {
    const formattedCity = capitalizeCityName(city);

    let history = this.getHistory();
    history = history.filter(c => c.toLowerCase() !== formattedCity.toLowerCase());
    history.unshift(formattedCity);
    if (history.length > maxHistoryItems) history = history.slice(0, maxHistoryItems);
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  },

  getFavorites() {
    return JSON.parse(localStorage.getItem("weatherFavorites")) || [];
  },

  saveFavorites(favorites) {
    localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
  },

  // ... restante do Storage
};

const App = {
  async handleCitySelect(city) {
    const formattedCity = capitalizeCityName(city);
    dom.cityInput.value = formattedCity;

    try {
      const data = await WeatherAPI.fetchByCity(formattedCity);
      UI.showWeather(data);
      Storage.saveHistory(formattedCity);
      UI.renderHistory();
      Storage.saveLastCity(formattedCity);
      this.updateButtonsState();
    } catch (err) {
      UI.showError(err.message || "Erro ao buscar o clima");
    }
  },

  addFavorite(city) {
    const formattedCity = capitalizeCityName(city);
    let favorites = Storage.getFavorites();

    if (favorites.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
      UI.showToast(`"${formattedCity}" já está nos favoritos.`);
      return;
    }

    favorites.push(formattedCity);
    Storage.saveFavorites(favorites);
    UI.renderFavorites();
    UI.showToast(`"${formattedCity}" adicionado aos favoritos!`);
    this.updateButtonsState();
  },

  // restante do seu App (removeFavorite, fetchByCoords, updateButtonsState, init, etc...)

  // só cuide para chamar as funções agora com nomes capitalizados ao salvar e mostrar
};

// ...restante do código (UI, showConfirmationModal, etc.)

window.onload = () => App.init();
