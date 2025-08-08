const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";

document.getElementById("searchBtn").addEventListener("click", async () => {
  const city = document.getElementById("city").value.trim();
  if (!city) {
    alert("Digite uma cidade");
    return;
  }

  const weatherDiv = document.getElementById("weather");
  weatherDiv.textContent = "Carregando...";

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    const data = await res.json();

    if (!data || data.cod !== 200) {
      weatherDiv.textContent = data?.error || "Cidade não encontrada.";
      return;
    }

    weatherDiv.innerHTML = `
      <h2>${data.name} - ${data.sys.country}</h2>
      <p>🌡️ Temperatura: ${data.main.temp}°C</p>
      <p>${data.weather[0].description}</p>
    `;
  } catch (error) {
    weatherDiv.textContent = "Erro ao buscar dados do clima.";
    console.error(error);
  }
});
