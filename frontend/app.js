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

const historyListEl = document.getElementById("history-list");
const maxHistoryItems = 5; // Máximo de cidades no histórico

// Aplica tema salvo ou padrão "light"
function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
    themeToggle.textContent = "Modo Claro";
    themeToggle.setAttribute("aria-pressed", "true");
  } else {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
    themeToggle.textContent = "Modo Escuro";
    themeToggle.setAttribute("aria-pressed", "false");
  }
}

// Formata horário do UNIX timestamp + timezone
function formatTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toUTCString().match(/(\d{2}:\d{2}:\d{2})/)[0];
}

// Atualiza o background conforme clima e tema
function setDynamicBackground(mainWeather) {
  const body = document.body;
  const theme = body.classList.contains("dark") ? "dark" : "light";

  const gradients = {
    light: {
      clear: "var(--bg-gradient-light-clear)",
      clouds: "var(--bg-gradient-light-clouds)",
      rain: "var(--bg-gradient-light-rain)",
      drizzle: "var(--bg-gradient-light-rain)",
      thunderstorm: "var(--bg-gradient-light-thunderstorm)",
      snow: "var(--bg-gradient-light-snow)",
    },
    dark: {
      clear: "var(--bg-gradient-dark-clear)",
      clouds: "var(--bg-gradient-dark-clouds)",
      rain: "var(--bg-gradient-dark-rain)",
      drizzle: "var(--bg-gradient-dark-rain)",
      thunderstorm: "var(--bg-gradient-dark-thunderstorm)",
      snow: "var(--bg-gradient-dark-snow)",
    },
  };

  const grad = gradients[theme][mainWeather.toLowerCase()] || gradients[theme].clear;
  body.style.background = grad;
}

// Atualiza o ícone do clima
function updateIcon(mainWeather) {
  const weatherClass = mainWeather.toLowerCase();
  iconEl.className = "weather-icon " + weatherClass;
}

// Exibe o clima na tela
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
}

// Exibe mensagem de erro
function showError(message) {
  weatherDiv.style.display = "none";
  errorMessageDiv.textContent = message;
  errorMessageDiv.style.display = "block";
  errorMessageDiv.focus();
  cityInput.focus();
}

// Histórico: carrega do localStorage e exibe
function loadHistory() {
  const history = JSON.parse(localStorage.getItem("cityHistory")) || [];
  historyListEl.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.textContent = city;
    li.addEventListener("click", () => {
      cityInput.value = city;
      fetchWeather(city);
    });
    li.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cityInput.value = city;
        fetchWeather(city);
      }
    });
    historyListEl.appendChild(li);
  });
}

// Histórico: adiciona cidade nova, evita duplicados e limita máximo
function addToHistory(city) {
  if (!city) return;
  let history = JSON.parse(localStorage.getItem("cityHistory")) || [];

  // Remove se já existir para reordenar
  history = history.filter(item => item.toLowerCase() !== city.toLowerCase());

  // Adiciona no início
  history.unshift(city);

  // Limita tamanho
  if (history.length > maxHistoryItems) {
    history = history.slice(0, maxHistoryItems);
  }

  localStorage.setItem("cityHistory", JSON.stringify(history));
  loadHistory();
}

// Busca o clima pela cidade
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
    addToHistory(city); // Atualiza histórico
    localStorage.setItem("lastCity", city);
  } catch (err) {
    showError(err.message);
  } finally {
    spinner.style.display = "none";
    searchBtn.disabled = false;
    cityInput.focus();
  }
}

// Busca pelo clima por coordenadas
async function fetchByCoords(lat, lon) {
  searchBtn.disabled = true;
  spinner.style.display = "block";
  errorMessageDiv.style.display = "none";
  weatherDiv.style.display = "none";

  try {
    const res = await fetch(`${backendUrl}?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Não foi possível obter o clima para sua localização.");
    const data = await res.json();
    displayWeather(data);
  } catch (err) {
    showError(err.message);
  } finally {
    spinner.style.display = "none";
    searchBtn.disabled = false;
    cityInput.focus();
  }
}

// Eventos para busca
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
  }
});

// Toggle tema claro/escuro
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  document.body.classList.toggle("light", !isDark);

  themeToggle.textContent = isDark ? "Modo Claro" : "Modo Escuro";
  themeToggle.setAttribute("aria-pressed", isDark);

  localStorage.setItem("theme", isDark ? "dark" : "light");

  if (weatherDiv.style.display !== "none") {
    const mainWeather = descEl.textContent.split(" ")[0];
    setDynamicBackground(mainWeather);
  }
});

// Seleciona o conteúdo do input ao focar para facilitar edição
cityInput.addEventListener("focus", () => {
  cityInput.select();
});

// Ao carregar, aplica tema salvo, carrega histórico e última cidade ou localização atual
window.onload = () => {
  applySavedTheme();
  loadHistory();

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
