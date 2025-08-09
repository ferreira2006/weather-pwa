const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const weatherDiv = document.getElementById("weather");
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const spinner = document.getElementById("spinner");
const messageDiv = document.getElementById("message");
const favoritesList = document.getElementById("favorites");

let currentCity = null;

// Função para mostrar mensagens
function showMessage(msg, type = "info") {
  messageDiv.textContent = msg;
  messageDiv.className = type;
}

// Função para mostrar spinner
function toggleSpinner(show) {
  spinner.style.display = show ? "block" : "none";
}

// Função para formatar hora
function formatTime(unix, timezone) {
  const date = new Date((unix + timezone) * 1000);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Buscar clima
async function fetchWeather(city) {
  toggleSpinner(true);
  showMessage("Carregando...");

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=5`);
    if (!res.ok) throw new Error("Cidade não encontrada");

    const data = await res.json();
    currentCity = city;

    renderWeather(data);
    showMessage("");
  } catch (err) {
    showMessage(`Ops! ${err.message}. Tente outro nome ou verifique a ortografia.`, "error");
  } finally {
    toggleSpinner(false);
  }
}

// Renderizar o clima
function renderWeather(data) {
  const detailsEl = document.createElement("div");

  // Comentários explicando cada dado
  detailsEl.innerHTML = `
    Vento: ${data.wind.speed} m/s<br/> <!-- Velocidade do vento -->
    Umidade: ${data.main.humidity}%<br/> <!-- Umidade relativa do ar -->
    Pressão: ${data.main.pressure} hPa<br/> <!-- Pressão atmosférica -->
    Visibilidade: ${(data.visibility / 1000).toFixed(1)} km<br/> <!-- Distância visível -->
    Nascer do sol: ${formatTime(data.sys.sunrise, data.timezone)}<br/> <!-- Horário do nascer do sol -->
    Pôr do sol: ${formatTime(data.sys.sunset, data.timezone)} <!-- Horário do pôr do sol -->
  `;

  weatherDiv.innerHTML = `
    <h2>${data.name} - ${data.weather[0].description}</h2>
    <p>Temperatura: ${data.main.temp}°C</p>
  `;
  weatherDiv.appendChild(detailsEl);
}

// Salvar cidade favorita
function saveFavorite(city) {
  let favs = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!favs.includes(city)) {
    favs.push(city);
    localStorage.setItem("favorites", JSON.stringify(favs));
    renderFavorites();
  }
}

// Renderizar favoritos
function renderFavorites() {
  favoritesList.innerHTML = "";
  let favs = JSON.parse(localStorage.getItem("favorites")) || [];
  favs.forEach(city => {
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.onclick = () => fetchWeather(city);
    favoritesList.appendChild(btn);
  });
}

// Atualização automática a cada 5 minutos
setInterval(() => {
  if (currentCity) fetchWeather(currentCity);
}, 5 * 60 * 1000);

// Evento de busca
searchForm.addEventListener("submit", e => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
    saveFavorite(city);
    cityInput.focus(); // Auto foco para nova pesquisa
    cityInput.select();
  }
});

// Inicializa
renderFavorites();
