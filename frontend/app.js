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

  // Salva a preferência no localStorage
  localStorage.setItem("theme", isDark ? "dark" : "light");

  if (weatherDiv.style.display !== "none") {
    const mainWeather = descEl.textContent.split(" ")[0];
    setDynamicBackground(mainWeather);
  }
});

// Ao carregar tenta pegar localização do usuário e aplica tema salvo
window.onload = () => {
  applySavedTheme();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => {}
    );
  }
};
