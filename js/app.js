// ==================== CONFIGURAÇÕES ====================
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

const stateSelect = document.getElementById("state-select");
const citySelect = document.getElementById("city-select");
const stateCitySearchBtn = document.getElementById("state-city-search-btn");

// ==================== UTILS ====================
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  },
  showToast(message, duration = 3000) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
  }
};

// ==================== ESTADOS E MUNICÍPIOS ====================
async function fetchStates() {
  try {
    const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
    const states = await res.json();
    states.forEach(state => {
      const option = document.createElement("option");
      option.value = state.sigla;
      option.textContent = state.nome;
      stateSelect.appendChild(option);
    });
  } catch (err) {
    Utils.showToast("Erro ao carregar estados.");
    console.error(err);
  }
}

async function fetchCities(uf) {
  citySelect.innerHTML = '<option value="">Selecione o município</option>';
  citySelect.disabled = true;
  stateCitySearchBtn.disabled = true;
  if (!uf) return;

  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    const cities = await res.json();
    cities.forEach(city => {
      const option = document.createElement("option");
      option.value = city.nome;
      option.textContent = city.nome;
      citySelect.appendChild(option);
    });
    citySelect.disabled = false;
  } catch (err) {
    Utils.showToast("Erro ao carregar municípios.");
    console.error(err);
  }
}

// ==================== EVENTOS SELECTS ====================
stateSelect.addEventListener("change", () => {
  const uf = stateSelect.value;
  fetchCities(uf);
});

citySelect.addEventListener("change", () => {
  stateCitySearchBtn.disabled = !citySelect.value;
});

// ==================== PESQUISA DE CLIMA ====================
async function getWeather(city) {
  const weatherSection = document.getElementById("weather");
  const cityNameEl = document.getElementById("city-name");
  const tempEl = document.getElementById("temp");
  const descEl = document.getElementById("desc");
  const detailsEl = document.getElementById("details");
  const iconEl = document.getElementById("icon");
  const errorEl = document.getElementById("weather-error");

  weatherSection.classList.add("loading");
  weatherSection.setAttribute("tabindex", "-1");
  errorEl.textContent = "";
  document.body.classList.remove("error");

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();

    cityNameEl.textContent = data.city;
    tempEl.textContent = `${Math.round(data.temp)} °C`;
    descEl.textContent = data.description;
    detailsEl.textContent = `Sensação: ${Math.round(data.feels_like)} °C | Umidade: ${data.humidity}% | Vento: ${data.wind_speed} m/s`;

    iconEl.className = `weather-icon ${data.icon}`;
    weatherSection.classList.remove("loading");

    // Atualiza histórico
    updateHistory(data.city);

    return data.city;
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || "Erro ao buscar clima";
    document.body.classList.add("error");
    weatherSection.classList.remove("loading");
  }
}

// ==================== HISTÓRICO ====================
function updateHistory(city) {
  const historyList = document.getElementById("history-list");
  let history = JSON.parse(localStorage.getItem("history")) || [];

  history = history.filter(c => c !== city);
  history.unshift(city);
  if (history.length > maxHistoryItems) history.pop();
  localStorage.setItem("history", JSON.stringify(history));

  renderHistory(history);
}

function renderHistory(history) {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener("click", () => getWeather(city));
    li.addEventListener("keypress", e => { if (e.key === "Enter") getWeather(city); });
    historyList.appendChild(li);
  });
}

// ==================== FAVORITOS ====================
function renderFavorites() {
  const favList = document.getElementById("favorites-list");
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favList.innerHTML = "";

  favorites.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener("click", () => getWeather(city));
    li.addEventListener("keypress", e => { if (e.key === "Enter") getWeather(city); });
    favList.appendChild(li);
  });

  updateFavButton();
}

function updateFavButton() {
  const favBtn = document.getElementById("fav-btn");
  const favIcon = document.getElementById("fav-icon");
  const cityName = document.getElementById("city-name").textContent;
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.includes(cityName)) {
    favIcon.className = "favorited";
  } else {
    favIcon.className = "not-favorited";
  }
  favBtn.disabled = !cityName || cityName === "Carregando cidade...";
}

document.getElementById("fav-btn").addEventListener("click", () => {
  const cityName = document.getElementById("city-name").textContent;
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.includes(cityName)) {
    // Mostrar modal de confirmação
    const modal = document.getElementById("confirm-modal");
    modal.hidden = false;

    document.getElementById("confirm-yes").onclick = () => {
      favorites = favorites.filter(c => c !== cityName);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      renderFavorites();
      modal.hidden = true;
      Utils.showToast(`${cityName} removida dos favoritos.`);
    };

    document.getElementById("confirm-no").onclick = () => {
      modal.hidden = true;
    };
  } else {
    favorites.push(cityName);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavorites();
    Utils.showToast(`${cityName} adicionada aos favoritos.`);
  }
});

// ==================== TEMA CLARO/ESCURO ====================
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  if (document.body.classList.contains("light")) {
    document.body.classList.replace("light", "dark");
    themeToggle.textContent = "Modo Claro";
    themeToggle.setAttribute("aria-pressed", "true");
  } else {
    document.body.classList.replace("dark", "light");
    themeToggle.textContent = "Modo Escuro";
    themeToggle.setAttribute("aria-pressed", "false");
  }
});

// ==================== INICIALIZAÇÃO ====================
async function init() {
  await fetchStates();
  renderFavorites();

  // Busca inicial
  const initialCity = "São Paulo"; // padrão
  getWeather(initialCity);
}

// ==================== BOTÃO STATE-CITY SEARCH ====================
stateCitySearchBtn.addEventListener("click", () => {
  const city = citySelect.value;
  if (!city) return;
  getWeather(city);
});

// ==================== EXECUTAR ====================
init();
