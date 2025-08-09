const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const weatherDiv = document.getElementById("weather");
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  weatherDiv.innerHTML = "<p>Carregando...</p>";

  try {
    const response = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}&days=5`);
    if (!response.ok) throw new Error("Cidade não encontrada");

    const data = await response.json();

    // Monta o card com as informações básicas
    weatherDiv.innerHTML = `
      <h2>Clima em ${data.name}, ${data.sys.country}</h2>
      <p><strong>Temperatura:</strong> ${data.main.temp.toFixed(1)} °C</p>
      <p><strong>Sensação térmica:</strong> ${data.main.feels_like.toFixed(1)} °C</p>
      <p><strong>Descrição:</strong> ${data.weather[0].description}</p>
      <p><strong>Umidade:</strong> ${data.main.humidity}%</p>
    `;

    // Atualiza título da página com o nome da cidade
    document.title = `Clima em ${data.name}`;

  } catch (error) {
    weatherDiv.innerHTML = `<p>Erro: ${error.message}</p>`;
  }
});
