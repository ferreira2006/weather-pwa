const btnLocate = document.getElementById('btn-locate');
const weatherInfo = document.getElementById('weather-info');
const errorMsg = document.getElementById('error-msg');

const BACKEND_URL = 'https://weather-pwa-zkmc.onrender.com/weather';

btnLocate.addEventListener('click', () => {
  errorMsg.textContent = '';
  weatherInfo.textContent = 'Buscando localização...';

  if (!navigator.geolocation) {
    errorMsg.textContent = 'Geolocalização não suportada no seu navegador.';
    weatherInfo.textContent = '';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const res = await fetch(`${BACKEND_URL}?lat=${latitude}&lon=${longitude}`);
        if (!res.ok) throw new Error('Erro ao buscar dados do servidor');
        const data = await res.json();

        weatherInfo.innerHTML = `
          <h2>${data.name}, ${data.sys.country}</h2>
          <p>Temperatura: ${data.main.temp} °C</p>
          <p>Clima: ${data.weather[0].description}</p>
        `;
      } catch (error) {
        errorMsg.textContent = error.message;
        weatherInfo.textContent = '';
      }
    },
    (err) => {
      errorMsg.textContent = `Erro ao obter localização: ${err.message}`;
      weatherInfo.textContent = '';
    }
  );
});

