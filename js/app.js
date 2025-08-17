const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

const stateSelect = document.getElementById("state-select");
const citySelect = document.getElementById("city-select");
const searchBtn = document.getElementById("search-btn");
const favBtn = document.getElementById("fav-btn");
const favIcon = document.getElementById("fav-icon");
const weatherSection = document.getElementById("weather");
const cityNameEl = document.getElementById("city-name");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const detailsEl = document.getElementById("details");
const weatherError = document.getElementById("weather-error");
const spinner = document.getElementById("spinner");
const favoritesList = document.getElementById("favorites-list");
const historyList = document.getElementById("history-list");
const toastEl = document.getElementById("toast");
const themeToggle = document.getElementById("theme-toggle");
const confirmModal = document.getElementById("confirm-modal");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

let favorites = [];
let history = [];
let currentCity = null;

const showToast = (msg) => {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2500);
};

const setLoading = (loading) => {
  if (loading) weatherSection.classList.add("loading");
  else weatherSection.classList.remove("loading");
};

const updateWeatherUI = (data) => {
  if (!data) return;
  cityNameEl.textContent = `${data.name}, ${data.state}`;
  tempEl.textContent = `${data.temp} °C`;
  descEl.textContent = data.desc;
  detailsEl.textContent = `Umidade: ${data.humidity}% | Vento: ${data.wind} km/h`;
  weatherSection.classList.remove("error");
  const iconClass = ["clear","clouds","rain","thunderstorm","snow"].includes(data.icon)?data.icon:"clear";
  document.getElementById("icon").className = `weather-icon ${iconClass}`;
};

const showError = (msg) => {
  weatherError.textContent = msg;
  weatherSection.classList.add("error");
};

const saveFavorites = () => localStorage.setItem("favorites", JSON.stringify(favorites));
const saveHistory = () => localStorage.setItem("history", JSON.stringify(history));

const loadFavorites = () => {
  const favs = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favs;
  renderFavorites();
};

const loadHistory = () => {
  const hist = JSON.parse(localStorage.getItem("history")) || [];
  history = hist;
  renderHistory();
};

const renderFavorites = () => {
  favoritesList.innerHTML = "";
  favorites.forEach(city => {
    const li = document.createElement("li");
    li.textContent = `${city.name}, ${city.state}`;
    li.tabIndex = 0;
    li.addEventListener("click", () => { selectCity(city.state, city.name); fetchWeather(city.state, city.name); });
    li.addEventListener("keydown", e => { if(e.key==="Enter") li.click(); });
    favoritesList.appendChild(li);
  });
  updateFavBtn();
};

const renderHistory = () => {
  historyList.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = `${city.name}, ${city.state}`;
    li.tabIndex = 0;
    li.addEventListener("click", () => { selectCity(city.state, city.name); fetchWeather(city.state, city.name); });
    li.addEventListener("keydown", e => { if(e.key==="Enter") li.click(); });
    historyList.appendChild(li);
  });
};

const updateFavBtn = () => {
  if (!currentCity) return;
  const exists = favorites.find(f => f.name===currentCity.name && f.state===currentCity.state);
  favIcon.className = exists ? "favorited" : "not-favorited";
  favBtn.disabled = false;
};

const addToHistory = (city) => {
  history = history.filter(h => !(h.name===city.name && h.state===city.state));
  history.unshift(city);
  if(history.length > maxHistoryItems) history.pop();
  saveHistory();
  renderHistory();
};

const selectCity = (state, city) => {
  stateSelect.value = state;
  citySelect.value = city;
  currentCity = {state, name: city};
  updateFavBtn();
};

const fetchWeather = async (state, city) => {
  setLoading(true);
  weatherSection.classList.remove("error");
  try {
    const res = await fetch(`${backendUrl}?state=${state}&city=${city}`);
    if(!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();
    updateWeatherUI(data);
    currentCity = {state, name: city};
    addToHistory(currentCity);
    updateFavBtn();
  } catch(e) {
    showError(e.message);
  } finally {
    setLoading(false);
  }
};

// ================= FAVORITOS =================
favBtn.addEventListener("click", () => {
  if (!currentCity) return;
  const exists = favorites.find(f => f.name===currentCity.name && f.state===currentCity.state);
  if (exists) confirmModal.hidden = false;
  else {
    favorites.push(currentCity);
    saveFavorites();
    renderFavorites();
    showToast("Cidade adicionada aos favoritos!");
  }
});

confirmYes.addEventListener("click", () => {
  favorites = favorites.filter(f => !(f.name===currentCity.name && f.state===currentCity.state));
  saveFavorites();
  renderFavorites();
  confirmModal.hidden = true;
  showToast("Cidade removida dos favoritos!");
});

confirmNo.addEventListener("click", () => { confirmModal.hidden = true; });

// ================= THEME TOGGLE =================
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "Modo Claro" : "Modo Escuro";
  themeToggle.setAttribute("aria-pressed", isDark);
});

// ================= SEARCH =================
searchBtn.addEventListener("click", e => {
  e.preventDefault();
  const state = stateSelect.value;
  const city = citySelect.value;
  if(!state || !city) return;
  fetchWeather(state, city);
});

// ================= IBGE API =================
const fetchStates = async () => {
  try {
    const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
    const data = await res.json();
    data.forEach(state => {
      const option = document.createElement("option");
      option.value = state.sigla;
      option.textContent = state.nome;
      stateSelect.appendChild(option);
    });
  } catch(e) { console.error("Erro ao carregar estados:", e); }
};

const fetchCities = async (stateSigla) => {
  citySelect.innerHTML = `<option value="" disabled selected>Selecione a cidade</option>`;
  citySelect.disabled = true;
  searchBtn.disabled = true;
  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateSigla}/municipios`);
    const data = await res.json();
    data.forEach(city => {
      const option = document.createElement("option");
      option.value = city.nome;
      option.textContent = city.nome;
      citySelect.appendChild(option);
    });
    citySelect.disabled = false;
  } catch(e) { console.error("Erro ao carregar cidades:", e); }
};

stateSelect.addEventListener("change", () => {
  const state = stateSelect.value;
  if(!state) return;
  fetchCities(state);
  searchBtn.disabled = true;
});

citySelect.addEventListener("change", () => {
  searchBtn.disabled = !(citySelect.value && stateSelect.value);
});

// ================= INICIALIZAÇÃO =================
loadFavorites();
loadHistory();
fetchStates();
