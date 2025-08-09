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

function formatTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toUTCString().match(/(\d{2}:\d{2}:\d{2})/)[0];
}

function setDynamicBackground(mainWeather) {
  const body = document.body;
  const theme = body.classList.contains('dark') ? 'dark' : 'light';

  const gradients = {
    light: {
      clear: 'var(--bg-gradient-light-clear)',
      clouds: 'var(--bg-gradient-light-clouds)',
      rain: 'var(--bg-gradient-light-rain)',
      drizzle: 'var(--bg-gradient-light-rain)',
      thunderstorm: 'var(--bg-gradient-light-thunderstorm)',
      snow: 'var(--bg-gradient-light-snow)',
    },
    dark: {
      clear: 'var(--bg-gradient-dark-clear)',
      clouds: 'var(--bg-gradient-dark-clouds)',
      rain: 'var(--bg-gradient-dark-rain)',
      drizzle: 'var(--bg-gradient-dark-rain)',
      thunderstorm: 'var(--bg-gradient-dark-thunderstorm)',
      snow: 'var(--bg-gradient-dark-snow)',
    }
  };

  const grad = gradients[theme][mainWeather.toLowerCase()] || gradients[theme].clear;
  body.style.background = grad;
}

function updateIcon(mainWeather) {
  const weatherClass = mainWeather.toLowerCase();
  iconEl.className = 'weather-icon ' + weatherClass;
}

function displayWeather(data) {
  errorMessageDiv.style.display = "none";
  weatherDiv.style.display = "grid";

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

function showError(message) {
  weatherDiv.style.display = "none";
  errorMessageDiv.textContent = message;
  errorMessageDiv.style.display = "block";
}

async function fetchWeather(city) {
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
  errorMessageDiv.style.display = "none";
  weatherDiv.style.display = "none";

  fetch(`${backendUrl}?lat=${lat}&lon=${lon}`)
    .then(res => {
      if (!res.ok) throw new Error("Não foi possível obter o clima para sua localização.");
      return res.json();
    })
    .then(data => {
      displayWeather(data);
    })
    .catch(err => {
      showError(err.message);
    })
    .finally(() => {
      spinner.style.display = "none";
      searchBtn.disabled = false;
    });
}

// Tema toggle
themeToggle.addEventListener('click', () => {
  if(document.body.classList.contains('dark')) {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    themeToggle.textContent = 'Modo Escuro';
  } else {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    themeToggle.textContent = 'Modo Claro';
  }
  // Atualiza o fundo conforme tema e clima atual
  if(weatherDiv.style.display !== "none") {
    const mainWeather = descEl.textContent.split(' ')[0]; // tenta pegar palavra chave
    setDynamicBackground(mainWeather);
  }
});

// Ao carregar a página tenta pegar a localização do usuário
window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        fetchByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      err => {
        fetchWeather("São Miguel do Oeste");
      }
    );
  } else {
    fetchWeather("São Miguel do Oeste");
  }
};
