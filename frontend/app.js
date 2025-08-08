const apiKey = "SUA_API_KEY_AQUI"; // Substituir pela sua API Key do OpenWeather
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");
const cityElement = document.getElementById("city");
const tempElement = document.getElementById("temp");
const descElement = document.getElementById("description");
const weatherIconCanvas = document.getElementById("weather-icon");

function setWeatherIcon(weather) {
    const skycons = new Skycons({ "color": "white" });
    let iconType;

    // Mapeamento básico do OpenWeather para Skycons
    if (weather.includes("cloud")) iconType = "PARTLY_CLOUDY_DAY";
    else if (weather.includes("rain")) iconType = "RAIN";
    else if (weather.includes("clear")) iconType = "CLEAR_DAY";
    else if (weather.includes("snow")) iconType = "SNOW";
    else if (weather.includes("thunderstorm")) iconType = "SLEET";
    else iconType = "FOG";

    skycons.add(weatherIconCanvas, Skycons[iconType]);
    skycons.play();
}

async function getWeather(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`
        );
        if (!response.ok) throw new Error("Cidade não encontrada");
        const data = await response.json();

        cityElement.textContent = `${data.name}, ${data.sys.country}`;
        tempElement.textContent = `${Math.round(data.main.temp)}°C`;
        descElement.textContent = data.weather[0].description;

        // Define ícone animado
        setWeatherIcon(data.weather[0].description.toLowerCase());
    } catch (error) {
        cityElement.textContent = "Erro";
        tempElement.textContent = "";
        descElement.textContent = error.message;
    }
}

// Evento de clique e Enter
searchBtn.addEventListener("click", () => {
    getWeather(searchBox.value);
});
searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") getWeather(searchBox.value);
});

// Pesquisa inicial
getWeather("São Paulo");
