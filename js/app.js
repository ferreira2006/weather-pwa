// ===== CONFIG =====
const backendUrl = "https://weather-backend-hh3w.onrender.com/weather";
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;
const stateSelect = document.getElementById("state-select");
const citySelect = document.getElementById("city-select");
const searchBtn = document.getElementById("state-city-search-btn");
const weatherContent = document.getElementById("weather-content");
const forecastContainer = document.getElementById("forecast");
const spinner = document.getElementById("spinner");
const toast = document.getElementById("toast");
const historyList = document.getElementById("history-list");
const favoritesList = document.getElementById("favorites-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const confirmModal = document.getElementById("confirm-modal");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");
const scrollTopBtn = document.getElementById("scroll-top-btn");

let history = JSON.parse(localStorage.getItem("history"))||[];
let favorites = JSON.parse(localStorage.getItem("favorites"))||[];

// ===== THEME =====
themeToggle.addEventListener("click",()=>{
  body.classList.toggle("light");
  body.classList.toggle("dark");
});

// ===== TOAST =====
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=> toast.classList.remove("show"),2000);
}

// ===== HISTORY & FAVORITES =====
function renderHistory(){
  historyList.innerHTML = "";
  history.forEach(city=>{
    const li=document.createElement("li");
    li.textContent=city;
    li.tabIndex=0;
    li.onclick = ()=>fetchWeather(city);
    historyList.appendChild(li);
  });
}
function renderFavorites(){
  favoritesList.innerHTML = "";
  favorites.forEach(city=>{
    const li=document.createElement("li");
    li.textContent=city;
    li.tabIndex=0;
    li.onclick = ()=>fetchWeather(city);
    favoritesList.appendChild(li);
  });
}
clearHistoryBtn.addEventListener("click",()=>confirmModal.hidden=false);
confirmYes.addEventListener("click",()=>{
  history=[]; localStorage.setItem("history",JSON.stringify(history));
  renderHistory(); confirmModal.hidden=true;
});
confirmNo.addEventListener("click",()=>confirmModal.hidden=true);

// ===== SCROLL TOP =====
window.addEventListener("scroll",()=>{scrollTopBtn.style.display=window.scrollY>200?"flex":"none";});
scrollTopBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));

// ===== WEATHER FETCH =====
searchBtn.addEventListener("click",()=>{
  const city=citySelect.value;
  if(city) fetchWeather(city);
});

async function fetchWeather(city){
  spinner.style.opacity=1;
  weatherContent.style.visibility="hidden";
  try{
    const res=await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    const data=await res.json();
    displayWeather(data);
    updateHistory(city);
  }catch(err){ showToast("Erro ao buscar dados"); }
  spinner.style.opacity=0;
  weatherContent.style.visibility="visible";
}

function updateHistory(city){
  if(!history.includes(city)) history.unshift(city);
  if(history.length>5) history.pop();
  localStorage.setItem("history",JSON.stringify(history));
  renderHistory();
}

// ===== DISPLAY =====
function displayWeather(data){
  if(!data) return;
  const {current,forecast}=data;
  weatherContent.innerHTML=`<h2>${current.name}, ${current.sys.country}</h2>
  <p>${current.weather[0].description} | ${Math.round(current.main.temp)}°C</p>`;
  forecastContainer.innerHTML="";
  forecast.forEach(day=>{
    const card=document.createElement("div");
    card.className="forecast-card";
    card.innerHTML=`<h3>${day.date}</h3>`+day.times.map(t=>`<div class="time-block">${t.time} - ${t.temp}°C - ${t.desc}</div>`).join("");
    forecastContainer.appendChild(card);
  });
}

// ===== INIT =====
renderHistory();
renderFavorites();
