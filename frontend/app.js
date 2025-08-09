const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const forecastContainer = document.getElementById("forecastContainer");
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");

async function getWeather(city = "São Miguel do Oeste") {
  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Erro ao buscar dados");
    const data = await res.json();
    displayForecast(data);
  } catch (error) {
    forecastContainer.innerHTML = `<p>Erro: ${error.message}</p>`;
  }
}

function displayForecast(data) {
  if (!data.forecast || !data.forecast.length) {
    forecastContainer.innerHTML = "<p>Nenhuma previsão disponível</p>";
    return;
  }

  forecastContainer.innerHTML = data.forecast
    .slice(0, 5)
    .map(day => `
      <div class="card">
        <h3>${day.date}</h3>
        <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
        <p>${day.description}</p>
        <p>🌡️ ${day.temp}°C</p>
        <p>💨 ${day.wind} km/h</p>
      </div>
    `)
    .join("");
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) {
    getWeather(city);
    cityInput.value = "";
  }
});

getWeather(); // Carrega São Miguel do Oeste ao abrir
