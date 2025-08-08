const apiKey = "SUA_API_KEY_AQUI"; // substitua pela sua chave da OpenWeather

const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");
const cityElement = document.getElementById("city");
const tempElement = document.getElementById("temp");
const descElement = document.getElementById("description");
const weatherIconCanvas = document.getElementById("weather-icon");

// Mapeamento de códigos OpenWeather para Skycons
function mapIconCodeToSkycon(code) {
    const map = {
        "01d": "CLEAR_DAY",
        "01n": "CLEAR_NIGHT",
        "02d": "PARTLY_CLOUDY_DAY",
        "02n": "PARTLY_CLOUDY_NIGHT",
        "03d": "CLOUDY",
        "03n": "CLOUDY",
        "04d": "CLOUDY",
        "04n": "CLOUDY",
        "09d": "RAIN",
        "09n": "RAIN",
        "10d": "RAIN",
        "10n": "RAIN",
        "11d": "SLEET",
        "11n": "SLEET",
        "13d": "SNOW",
        "13n": "SNOW",
        "50d": "FOG",
        "50n": "FOG"
    };
    return map[code] || "CLOUDY";
}

// Define ícone animado no canvas
function setWeatherIcon(iconCode) {
    const skycons = new Skycons({ "color": "white" });
    const iconType = mapIconCodeToSkycon(iconCode);
    skycons.add(weatherIconCanvas, Skycons[iconType]);
    skycons.play();
}

// Busca e exibe o clima
async function getWeather(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`
        );
        if (!response.ok) throw new Error("Cidade não encontrada");

        const data = await response.json();

        // Atualiza informações
        cityElement.textContent = `${data.name}, ${data.sys.country}`;
        tempElement.textContent = `${Math.round(data.main.temp)}°C`;
        descElement.textContent = data.weather[0].description;

        // Atualiza ícone animado com base no código da API
        setWeatherIcon(data.weather[0].icon);

    } catch (error) {
        cityElement.textContent = "Erro";
        tempElement.textContent = "";
        descElement.textContent = error.message;
    }
}

// Eventos de busca
searchBtn.addEventListener("click", () => {
    getWeather(searchBox.value);
});
searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") getWeather(searchBox.value);
});

// Busca inicial padrão
getWeather("São Paulo");
