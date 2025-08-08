async function getWeather(lat, lon) {
    try {
        const res = await fetch(`https://SEU_BACKEND.onrender.com/weather?lat=${lat}&lon=${lon}`);
        const data = await res.json();

        document.getElementById("weather").innerHTML = `
            <h2>${data.name}</h2>
            <p>${data.weather[0].description}</p>
            <p>Temperatura: ${data.main.temp}°C</p>
        `;
    } catch (error) {
        console.error("Erro:", error);
    }
}

if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
        getWeather(position.coords.latitude, position.coords.longitude);
    });
}

