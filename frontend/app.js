const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");

const weatherDiv = document.getElementById("weather");
const cityNameEl = document.getElementById("city-name");
const iconEl = document.getElementById("icon");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const detailsEl = document.getElementById("details");
const spinner = document.getElementById("spinner");
const errorMessageDiv = document.getElementById("error-message");
const themeToggle = document.getElementById("theme-toggle");

// Criar container para histórico (dentro do HTML ou dinamicamente)
let historyContainer = document.getElementById("history-container");
if (!historyContainer) {
  historyContainer = document.createElement("div");
  historyContainer.id = "history-container";
  historyContainer.style.marginTop = "10px";
  cityInput.parentNode.appendChild(historyContainer);
}

const MAX_HISTORY = 5;

// Função para pegar histórico do localStorage
function getSearchHistory() {
  const history = localStorage.getItem("searchHistory");
  return history ? JSON.parse(history) : [];
}

// Função para salvar histórico no localStorage
function saveSearchHistory(history) {
  localStorage.setItem("searchHistory", JSON.stringify(history));
}

// Atualizar visual do histórico na tela
function renderSearchHistory() {
  const history = getSearchHistory();
  if (history.length === 0) {
    historyContainer.innerHTML = "";
    return;
  }

  historyContainer.innerHTML = "<strong>Últimas buscas:</strong>";
  const ul = document.createElement("ul");
  ul.style.paddingLeft = "20px";
  ul.style.marginTop = "5px";
  ul.style.cursor = "pointer";

  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.style.color = "var(--button-bg)";
    li.style.userSelect = "none";
    li.addEventListener("click", () => {
      cityInput.value = city;
      fetchWeather(city);
    });
    ul.appendChild(li);
  });

  historyContainer.appendChild(ul);
}

// Adicionar cidade ao histórico, evitando duplicados e limitando tamanho
function addToHistory(city) {
  if (!city) return;
  let history = getSearchHistory();
  city = city.trim();
  // Remove se já existir para reordenar depois
  history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
  history.unshift(city); // adiciona no começo
  if (history.length > MAX_HISTORY) {
    history.pop();
  }
  saveSearchHistory(history);
  renderSearchHistory();
}

// Modifica função displayWeather para adicionar cidade ao histórico após mostrar resultado
function displayWeather(data) {
  errorMessageDiv.style.display = "none";
  weatherDiv.style.display = "grid";
  weatherDiv.focus();

  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  tempEl.textContent = Math.round(data.main.temp) + "°C";
  descEl.textContent = data.weather[0].description;

  detailsEl.innerHTML = `
    Vento: ${data.wind.speed} m/s<br/>
    Umidade: ${data.main.humidity}%<br/>
    Pressão: ${data.main.pressure} hPa<br/>
    Visibilidade: ${(data.visibility / 1000).toFixed(1)} km<br/>
    Nascer do sol: ${formatTime(data.sys.sunrise, data.timezone)}<br/>
    Pôr do sol: ${formatTime(data.sys.sunset, data.timezone)}
  `;

  updateIcon(data.weather[0].main);
  setDynamicBackground(data.weather[0].main);

  // Atualizar histórico
  addToHistory(data.name);
}

// Ajuste na fetchWeather para salvar lastCity e atualizar histórico lá também
async function fetchWeather(city) {
  if (!city) return;

  searchBtn.disabled = true;
  spinner.style.display = "block";
  errorMessageDiv.style.display = "none";

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();
    displayWeather(data);
    // Salva a última cidade pesquisada (para recarregar ao abrir)
    localStorage.setItem("lastCity", city);
  } catch (err) {
    showError(err.message);
  } finally {
    spinner.style.display = "none";
    searchBtn.disabled = false;
    cityInput.focus();
  }
}

// O restante do código permanece igual...

// Ao carregar a página, renderizar histórico e aplicar tema etc
window.onload = () => {
  applySavedTheme();
  renderSearchHistory();

  const lastCity = localStorage.getItem("lastCity");
  if (lastCity) {
    cityInput.value = lastCity;
    fetchWeather(lastCity);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => {}
    );
  }
};
