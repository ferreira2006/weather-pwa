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
const spinnerText = document.getElementById("spinner-text"); // novo
const errorMessageDiv = document.getElementById("error-message");
const themeToggle = document.getElementById("theme-toggle");
const favoritesDiv = document.getElementById("favorites");

function formatTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toUTCString().match(/(\d{2}:\d{2}:\d{2})/)[0];
}

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

  const grad =
    gradients[theme][mainWeather.toLowerCase()] || gradients[theme].clear;
  body.style.background = grad;
}

function updateIcon(mainWeather) {
  iconEl.className = "weather-icon " + mainWeather.toLowerCase();
}

function displayWeather(data) {
  errorMessageDiv.style.display = "none";
  weatherDiv.style.display = "grid";

  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  tempEl.textContent = Math.round(data.main.temp) + "°C";
  descEl.textContent = data.weather[0].description;

  const sensacao = `Sensação térmica: ${data.main.feels_like.toFixed(1)}°`;
  const vento = `Vento: ${data.wind.speed} m/s`;
  const umidade = `Umidade: ${data.main.humidity}%`;
  const pressao = `Pressão: ${data.main.pressure} hPa`;
  const visibilidade = `Visibilidade: ${(data.visibility / 1000).toFixed(1)} km`;
  const nascersol = `Nascer do sol: ${formatTime(
    data.sys.sunrise,
    data.timezone
  )}`;
  const porsol = `Pôr do sol: ${formatTime(data.sys.sunset, data.timezone)}`;

  detailsEl.innerHTML = `
    ${sensacao}<br/>
    ${vento}<br/>
    ${umidade}<br/>
    ${pressao}<br/>
    ${visibilidade}<br/>
    ${nascersol}<br/>
    ${porsol}
  `;

  updateIcon(data.weather[0].main);
  setDynamicBackground(data.weather[0].main);
}

function showError(message) {
  let userMessage =
    "Ops! Não encontramos essa cidade. Tente outro nome ou verifique a ortografia.";
  if (message.toLowerCase().includes("network")) {
    userMessage =
      "Problema de conexão. Verifique sua internet e tente novamente.";
  }
  errorMessageDiv.textContent = userMessage;
  errorMessageDiv.style.display = "block";
  weatherDiv.style.display = "none";
}

async function fetchWeather(city) {
  searchBtn.disabled = true;
  spinner.style.display = "block";
  spinnerText.textContent = "Carregando...";
  errorMessageDiv.style.display = "none";

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    const data = await res.json();
    displayWeather(data);
    getAirQuality(data.coord.lat, data.coord.lon);
    saveFavorite(city);
  } catch (err) {
    showError(err.message);
  } finally {
    spinner.style.display = "none";
    searchBtn.disabled = false;
    cityInput.focus();
    cityInput.select();
  }
}

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

// Geolocalização para clima da cidade atual
function fetchByCoords(lat, lon) {
  searchBtn.disabled = true;
  spinner.style.display = "block";
  spinnerText.textContent = "Carregando...";
  errorMessageDiv.style.display = "none";
  weatherDiv.style.display = "none";

  fetch(`${backendUrl}?lat=${lat}&lon=${lon}`)
    .then((res) => {
      if (!res.ok)
        throw new Error("Não foi possível obter o clima para sua localização.");
      return res.json();
    })
    .then((data) => displayWeather(data))
    .catch((err) => showError(err.message))
    .finally(() => {
      spinner.style.display = "none";
      searchBtn.disabled = false;
    });
}

// Favoritos
function saveFavorite(city) {
  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (!favs.includes(city)) {
    favs.push(city);
    localStorage.setItem("favorites", JSON.stringify(favs));
    renderFavorites();
  }
}

function renderFavorites() {
  favoritesDiv.innerHTML = "";
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  favs.forEach((city) => {
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.className = "fav-btn";
    btn.addEventListener("click", () => fetchWeather(city));
    favoritesDiv.appendChild(btn);
  });
}

// Tema
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "Modo Claro"
    : "Modo Escuro";
  if (weatherDiv.style.display !== "none") {
    const mainWeather = descEl.textContent.split(" ")[0];
    setDynamicBackground(mainWeather);
  }
});

// Autocomplete usando API do GeoDB Cities
async function autocompleteCities(query) {
  if (query.length < 2) return;
  const res = await fetch(
    `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${query}&limit=5`,
    {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "SUA_CHAVE_AQUI",
        "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
      },
    }
  );
  const data = await res.json();
  console.log("Sugestões:", data.data);
}
cityInput.addEventListener("input", () =>
  autocompleteCities(cityInput.value.trim())
);

// Inicialização
window.onload = () => {
  renderFavorites();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather("São Miguel do Oeste")
    );
  } else {
    fetchWeather("São Miguel do Oeste");
  }
};

// Atualização automática
setInterval(() => {
  if (weatherDiv.style.display !== "none") {
    const city = cityNameEl.textContent.split(",")[0];
    if (city) fetchWeather(city);
  }
}, 10 * 60 * 1000);

function getAirQuality(lat, lon) {
  const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  fetch(aqiUrl)
    .then((res) => res.json())
    .then((aqiData) => {
      const aqi = aqiData.list[0].main.aqi;
      const description = getAqiDescription(aqi);
      const aqiEl = document.getElementById("air-quality");
      if (aqiEl) {
        aqiEl.innerHTML = `Qualidade do Ar: <strong>${description}</strong>`;
        aqiEl.style.backgroundColor = getAqiColor(aqi);
      }
    })
    .catch((err) => console.error("Erro ao buscar AQI:", err));
}

function getAqiDescription(aqi) {
  switch (aqi) {
    case 1:
      return "Boa";
    case 2:
      return "Razoável";
    case 3:
      return "Moderada";
    case 4:
      return "Ruim";
    case 5:
      return "Muito Ruim";
    default:
      return "Desconhecida";
  }
}

function getAqiColor(aqi) {
  switch (aqi) {
    case 1:
      return "#4caf50";
    case 2:
      return "#cddc39";
    case 3:
      return "#ffeb3b";
    case 4:
      return "#ff9800";
    case 5:
      return "#f44336";
    default:
      return "#9e9e9e";
  }
}
