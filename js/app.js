const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const maxHistoryItems = 5;

const Utils = {
  capitalizeCityName(city) {
    return city.toLowerCase().split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  }
};

const Elements = {
  body: document.body,
  themeToggle: document.getElementById("theme-toggle"),
  searchBox: document.getElementById("search-box"),
  searchBtn: document.getElementById("search-btn"),
  favBtn: document.getElementById("fav-btn"),
  favIcon: document.getElementById("fav-icon"),
  cityName: document.getElementById("city-name"),
  temp: document.getElementById("temp"),
  desc: document.getElementById("desc"),
  details: document.getElementById("details"),
  weather: document.getElementById("weather"),
  weatherError: document.getElementById("weather-error"),
  spinner: document.getElementById("spinner"),
  favoritesList: document.getElementById("favorites-list"),
  historyList: document.getElementById("history-list"),
  toast: document.getElementById("toast"),
  confirmModal: document.getElementById("confirm-modal"),
  confirmYes: document.getElementById("confirm-yes"),
  confirmNo: document.getElementById("confirm-no"),
  icon: document.getElementById("icon")
};

let favorites = JSON.parse(localStorage.getItem("favorites")||"[]");
let history = JSON.parse(localStorage.getItem("history")||"[]");

function renderFavorites() {
  Elements.favoritesList.innerHTML = '';
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', ()=>fetchWeather(city));
    Elements.favoritesList.appendChild(li);
  });
}

function renderHistory() {
  Elements.historyList.innerHTML = '';
  history.slice(-maxHistoryItems).reverse().forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.tabIndex = 0;
    li.addEventListener('click', ()=>fetchWeather(city));
    Elements.historyList.appendChild(li);
  });
}

function showToast(msg){
  Elements.toast.textContent = msg;
  Elements.toast.classList.add("show");
  setTimeout(()=>Elements.toast.classList.remove("show"),2000);
}

function toggleTheme(){
  const isDark = Elements.body.classList.toggle("dark");
  Elements.body.classList.toggle("light", !isDark);
  Elements.themeToggle.textContent = isDark?"Modo Claro":"Modo Escuro";
  Elements.themeToggle.setAttribute("aria-pressed", isDark);
}

Elements.themeToggle.addEventListener("click", toggleTheme);

async function fetchWeather(city){
  if(!city) return;
  Elements.weather.classList.add("loading");
  Elements.weatherError.textContent = '';
  Elements.weatherError.style.display='none';
  Elements.weatherContent = document.getElementById("weather-content");
  try{
    const resp = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if(!resp.ok) throw new Error("Cidade não encontrada");
    const data = await resp.json();
    Elements.cityName.textContent = Utils.capitalizeCityName(data.name);
    Elements.temp.textContent = `${Math.round(data.main.temp)} °C`;
    Elements.desc.textContent = data.weather[0].description;
    Elements.details.textContent = `Sensação: ${Math.round(data.main.feels_like)}°C | Umidade: ${data.main.humidity}% | Vento: ${Math.round(data.wind.speed)} m/s`;
    Elements.icon.className = `weather-icon ${data.weather[0].main.toLowerCase()}`;
    Elements.weather.classList.remove("loading");
    history.push(Utils.capitalizeCityName(data.name));
    localStorage.setItem("history", JSON.stringify(history));
    renderHistory();
    Elements.searchBtn.disabled = false;
    Elements.favBtn.disabled = false;
  }catch(e){
    Elements.weatherError.textContent = e.message;
    Elements.weatherError.style.display='block';
    Elements.weather.classList.remove("loading");
  }
}

Elements.searchBox.addEventListener("submit",(e)=>{
  e.preventDefault();
  const city = e.target.querySelector("input, select")?.value;
  fetchWeather(city);
});

// Favoritos
Elements.favBtn.addEventListener("click", ()=>{
  const city = Elements.cityName.textContent;
  if(!city) return;
  if(favorites.includes(city)){
    favorites = favorites.filter(c=>c!==city);
    Elements.favIcon.className="not-favorited";
  }else{
    favorites.push(city);
    Elements.favIcon.className="favorited";
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
});

renderFavorites();
renderHistory();
