const backendUrl = "https://SEU_BACKEND_NO_RENDER.onrender.com/weather";

document.getElementById("searchBtn").addEventListener("click", async () => {
  const city = document.getElementById("city").value.trim();
  if (!city) {
    alert("Digite uma cidade");
    return;
  }

  document.getElementById("weather").textContent = "Carregando...";

  try {
    const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    const data = await res.json();

    if (!data || data.cod !== 200) {
      document.getElementById("weather").textContent = data?.error || "Cidade não encontrada.";
      return;
    }

    document.getElementById("weather").innerHTML = `
      <h2>${data.name} - ${data.sys.country}</h2>
      <p>🌡️ Temperatura: ${data.main.temp}°C</p>
      <p>${data.weather[0].description}</p>
    `;
  } catch (error) {
    document.getElementById("weather").textContent = "Erro ao buscar dados do clima.";
    console.error(error);
  }
});
