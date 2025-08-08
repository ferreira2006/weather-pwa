const backendUrl = "https://SEU_BACKEND_NO_RENDER.onrender.com/weather";

document.getElementById("searchBtn").addEventListener("click", async () => {
    const city = document.getElementById("city").value.trim();
    if (!city) return alert("Digite uma cidade");

    try {
        const res = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
        const data = await res.json();

        if (data.cod !== 200) {
            document.getElementById("weather").innerText = "Cidade não encontrada.";
            return;
        }

        document.getElementById("weather").innerHTML = `
            <h2>${data.name} - ${data.sys.country}</h2>
            <p>🌡️ ${data.main.temp}°C</p>
            <p>${data.weather[0].description}</p>
        `;
    } catch (error) {
        document.getElementById("weather").innerText = "Erro ao buscar clima.";
    }
});
