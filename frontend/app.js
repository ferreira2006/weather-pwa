const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

const weatherDiv = document.getElementById('weather');
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    weatherDiv.textContent = "Por favor, insira o nome de uma cidade.";
    return;
  }

  weatherDiv.textContent = "Buscando clima...";

  try {
    const response = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    const data = await response.json();

    // Exibir dados do clima
    weatherDiv.innerHTML = `
      <h2>Clima em ${data.city}</h2>
      <p>Temperatura: ${data.temperature} °C</p>
      <p>Condição: ${data.condition}</p>
    `;
    
    // Atualizar título da página com nome da cidade
    document.title = `Clima em ${data.city}`;

  } catch (error) {
    weatherDiv.textContent = "Erro ao buscar o clima. Tente novamente.";
    console.error(error);
  }
});
