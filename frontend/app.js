const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const weatherDiv = document.getElementById("weather");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const spinner = document.getElementById("spinner");
const statusMessage = document.getElementById("status-message");
const favoritesList = document.getElementById("favorites-list");

let currentCity = null;

// Mostrar mensagem de status (info, erro etc.)
function showMessage(msg, type = "info") {
  statusMessage.textContent = msg;
  statusMessage.className = type;
}

// Mostrar/ocultar spinner
function toggleSpinner(show) {
  spinner.style.display = show ? "block" : "none";
}

// Formatar hora com fuso horário
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
    weatherDiv.style.display = "none";
  } finally {
    toggleSpinner(false);
  }
}

// Renderizar dados do clima
function renderWeather(data) {
  document.getElementById("city-name").textContent = data.name;
  document.getElementById("temp").textContent = `${data.main.temp}°C`;
  document.getElementById("desc").textContent = data.weather[0].description;

  document.getElementById("details").innerHTML = `
    Vento: ${data.wind.speed} m/s<br/>
    Umidade: ${data.main.humidity}%<br/>
    Pressão: ${data.main.pressure} hPa<br/>
    Visibilidade: ${(data.visibility / 1000).toFixed(1)} km<br/>
    Nascer do sol: ${formatTime(data.sys.sunrise, data.timezone)}<br/>
    Pôr do sol: ${formatTime(data.sys.sunset, data.timezone)}
  `;

  // Atualizar ícone (se houver caminho para ícones locais)
  const iconCode = data.weather[0].icon;
  const iconDiv = document.getElementById("icon");
  iconDiv.innerHTML = `<img src="../icons/${iconCode}.png" alt="${data.weather[0].description}" />`;

  weatherDiv.style.display = "block";
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

// Renderizar lista de favoritos
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

// Evento de clique no botão "Buscar"
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
    saveFavorite(city);
    cityInput.focus();
    cityInput.select();
  }
});

// Inicializar lista de favoritos ao carregar
renderFavorites();
