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

function formatTime(timestamp, timezone) {
  // timezone em segundos, converte para ms
  const date = new Date((timestamp + timezone) * 1000);
  return date.toUTCString().match(/(\d{2}:\d{2}:\d{2})/)[0];
}

function displayWeather(data) {
  setDynamicBackground(data.weather[0].main);
  errorMessageDiv.style.display = "none";
  weatherDiv.style.display = "block";

  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  iconEl.alt = data.weather[0].description;
  tempEl.textContent = Math.round(data.main.temp) + "°C";
  descEl.textContent = data.weather[0].description;

  detailsEl.innerHTML = `
    <!--  Vento: ${data.wind.speed} m/s<br/> -->
    <!--  Umidade: ${data.main.humidity}%<br/> -->
    <!--  Pressão: ${data.main.pressure} hPa<br/> -->
    <!--  Visibilidade: ${data.visibility / 1000} km<br/> -->
      Nascer do sol: ${formatTime(data.sys.sunrise, data.timezone)}<br/>
      Pôr do sol: ${formatTime(data.sys.sunset, data.timezone)}
  `;
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

// Altere o fundo conforme o clima atual
function setDynamicBackground(mainWeather) {
  const body = document.body;
  switch(mainWeather.toLowerCase()) {
    case 'clear':
      body.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'; // céu azul
      break;
    case 'clouds':
      body.style.background = 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)'; // cinza claro
      break;
    case 'rain':
    case 'drizzle':
      body.style.background = 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)'; // azul chuva
      break;
    case 'thunderstorm':
      body.style.background = 'linear-gradient(135deg, #141e30 0%, #243b55 100%)'; // escuro, temp.
      break;
    case 'snow':
      body.style.background = 'linear-gradient(135deg, #e6dada 0%, #274046 100%)'; // frio
      break;
    default:
      body.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
  }
}

function updateIcon(mainWeather) {
  const iconDiv = document.getElementById('icon');
  iconDiv.className = 'weather-icon ' + mainWeather.toLowerCase();
}


// Ao carregar a página tenta pegar a localização do usuário
window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        fetchByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      err => {
        // Se falhar ou negar permissão, mostra clima padrão
        fetchWeather("São Miguel do Oeste");
      }
    );
  } else {
    // Navegador não suporta geolocalização
    fetchWeather("São Miguel do Oeste");
  }
};

