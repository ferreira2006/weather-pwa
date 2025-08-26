const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";
let city = "São Miguel do Oeste";
const horariosPadraoFuturos = [6, 12, 18]; // para os próximos dias

// ======================= UTILITÁRIOS =======================
function capitalizeWords(str) {
  return str.split(' ').map(word =>
    word.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-')
  ).join(' ');
}

function climaGradient(desc) {
  const d = desc.toLowerCase();
  if(d.includes("céu limpo")||d.includes("limpo")) return "linear-gradient(90deg, #fff59d, #ffe57f)";
  if(d.includes("nuvens")||d.includes("nublado")) return "linear-gradient(90deg, #b0bec5, #90a4ae)";
  if(d.includes("chuva")||d.includes("garoa")) return "linear-gradient(90deg, #90caf9, #64b5f6)";
  if(d.includes("trovoada")) return "linear-gradient(90deg, #ce93d8, #ba68c8)";
  if(d.includes("neve")) return "linear-gradient(90deg, #e1f5fe, #b3e5fc)";
  if(d.includes("névoa")||d.includes("neblina")||d.includes("fumaça")||d.includes("bruma")) return "linear-gradient(90deg, #f5f5dc, #e0dfc6)";
  return "linear-gradient(90deg, #b0bec5, #90a4ae)";
}

// ======================= HISTÓRICO E FAVORITOS =======================
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let history = JSON.parse(localStorage.getItem('history') || '[]');

function addToHistory(cityName){
  if(!history.includes(cityName)){
    history.unshift(cityName);
    if(history.length>10) history.pop();
    localStorage.setItem('history', JSON.stringify(history));
    renderHistory();
  }
}

function renderHistory(){
  const histDiv = document.getElementById('history-list');
  if(!histDiv) return;
  histDiv.innerHTML = '';
  history.forEach(c=>{
    const li = document.createElement('li');
    li.textContent = c; li.tabIndex = 0;
    li.addEventListener('click', ()=>carregarPrevisao(c));
    histDiv.appendChild(li);
  });
}

function renderFavorites(){
  const favDiv = document.getElementById('favorites-list');
  if(!favDiv) return;
  favDiv.innerHTML = '';
  favorites.forEach(c=>{
    const li = document.createElement('li');
    li.textContent = c; li.tabIndex = 0;
    li.addEventListener('click', ()=>carregarPrevisao(c));
    favDiv.appendChild(li);
  });
}

// ======================= DARK/LIGHT MODE =======================
let theme = localStorage.getItem('theme') || 'light';
document.body.classList.add(theme);
const themeToggle = document.getElementById('theme-toggle');
if(themeToggle){
  themeToggle.addEventListener('click', ()=>{
    theme = theme==='light'?'dark':'light';
    document.body.classList.toggle('light');
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', theme);
  });
}

// ======================= BUSCA E AGRUPA DADOS =======================
async function carregarPrevisao(cidadeEscolhida = city) {
  try {
    const resp = await fetch(`${backendUrl}?city=${encodeURIComponent(cidadeEscolhida)}`);
    if(!resp.ok) throw new Error(`Erro HTTP: ${resp.status}`);
    const dados = await resp.json();
    if(!dados.list) throw new Error("Resposta inesperada do backend");

    document.getElementById("tituloCidade").innerHTML = "Previsão do Tempo - " + cidadeEscolhida;
    addToHistory(cidadeEscolhida);
    const diasMap = agruparPorDia(dados.list);
    prepararCards(diasMap);
  } catch(err) {
    console.error("Erro ao carregar previsão:", err);
    document.getElementById("cards").innerHTML = `<p>Não foi possível carregar a previsão.</p>`;
  }
}

// ======================= AGRUPA POR DIA =======================
function agruparPorDia(list) {
  const agora = new Date();
  const formatterData = new Intl.DateTimeFormat("pt-BR", { timeZone:"America/Sao_Paulo", day:"2-digit", month:"2-digit", year:"numeric" });
  const formatterHora = new Intl.DateTimeFormat("pt-BR", { timeZone:"America/Sao_Paulo", hour:"numeric", hour12:false });
  const formatterDiaSemana = new Intl.DateTimeFormat("pt-BR", { timeZone:"America/Sao_Paulo", weekday:"long" });
  const hojeStr = formatterData.format(agora);

  const diasMap = new Map();

  list.forEach(item => {
    const data = new Date(item.dt * 1000);
    const dataLocalStr = formatterData.format(data);
    const horaLocal = parseInt(formatterHora.format(data));
    const diaSemana = capitalizeWords(formatterDiaSemana.format(data));
    const isHoje = dataLocalStr === hojeStr;

    if(!diasMap.has(dataLocalStr)) diasMap.set(dataLocalStr, { diaSemana, horarios: [], isToday: isHoje });

    diasMap.get(dataLocalStr).horarios.push({
      hora: horaLocal,
      desc: item.weather[0].description,
      temp: Math.round(item.main.temp),
      feels_like: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      pop: Math.round((item.pop||0)*100),
      icon: item.weather[0].icon,
      fromTomorrow: false
    });
  });

  return diasMap;
}

// ======================= PREPARA HORÁRIOS DOS CARDS =======================
function prepararCards(diasMap) {
  const agora = new Date();
  const diasOrdenados = Array.from(diasMap.keys()).sort();
  const hojeStr = diasOrdenados[0];
  const hojeData = diasMap.get(hojeStr);

  if (hojeData) {
    let proximos = hojeData.horarios
      .sort((a,b) => a.hora - b.hora)
      .filter(h => h.hora > agora.getHours());

    const indiceHoje = diasOrdenados.indexOf(hojeStr);
    const amanhaData = diasMap.get(diasOrdenados[indiceHoje + 1]);
    if (amanhaData && proximos.length < 4) {
      amanhaData.horarios
        .sort((a,b) => a.hora - b.hora)
        .forEach(h => { if(proximos.length<4) proximos.push({...h, fromTomorrow:true}); });
    }

    hojeData.horarios = proximos.slice(0,4);
  }

  diasOrdenados.slice(1).forEach(dia => {
    const dataDia = diasMap.get(dia);
    dataDia.horarios = dataDia.horarios
      .filter(h => horariosPadraoFuturos.includes(h.hora))
      .sort((a,b) => a.hora - b.hora);
  });

  renderCards(diasOrdenados, diasMap);
}

// ======================= RENDERIZA CARDS =======================
function renderCards(diasOrdenados, diasMap){
  const cardsDiv = document.getElementById("cards");
  cardsDiv.innerHTML = "";

  let tooltip = document.querySelector(".tooltip");
  if(!tooltip){
    tooltip = document.createElement("div");
    tooltip.className="tooltip";
    document.body.appendChild(tooltip);
  }

  diasOrdenados.slice(0,4).forEach(dia=>{
    const dataDia = diasMap.get(dia);
    const card = document.createElement("div");
    card.className = "card";

    const titulo = document.createElement("h2");
    titulo.textContent = `${dataDia.diaSemana} - ${dia}`;
    card.appendChild(titulo);

    dataDia.horarios.forEach(p=>{
      const horarioDiv = document.createElement("div");
      horarioDiv.className = "horario";
      horarioDiv.style.background = climaGradient(p.desc);

      horarioDiv.innerHTML = `
        <strong>${p.hora}h</strong>
        ${p.fromTomorrow ? `<span style="font-size:0.8em; margin-left:4px;">Amanhã</span>` : ""}
        <img src="https://openweathermap.org/img/wn/${p.icon}.png" alt="${p.desc}">
        <span class="desc">${capitalizeWords(p.desc)}</span>
        <span class="temp">${p.temp}°C</span>
      `;

      horarioDiv.addEventListener("mousemove", e=>{
        tooltip.innerHTML = `Sensação: ${p.feels_like}°C<br>Umidade: ${p.humidity}%<br>Chuva: ${p.pop}%`;
        tooltip.style.opacity=1;
        let left=e.clientX+12, top=e.clientY+12;
        if(left+tooltip.offsetWidth>window.innerWidth) left=window.innerWidth-tooltip.offsetWidth-4;
        if(top+tooltip.offsetHeight>window.innerHeight) top=window.innerHeight-tooltip.offsetHeight-4;
        tooltip.style.left=left+"px";
        tooltip.style.top=top+"px";
      });
      horarioDiv.addEventListener("mouseleave", ()=>tooltip.style.opacity=0);

      card.appendChild(horarioDiv);
    });

    cardsDiv.appendChild(card);
  });
}

// ======================= IBGE: ESTADOS E MUNICÍPIOS =======================
async function carregarEstados() {
  const estadoSelect = document.getElementById('estadoSelect');
  const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
  const estados = await resp.json();
  estados.sort((a,b)=>a.nome.localeCompare(b.nome));
  estados.forEach(est=>{
    const option = document.createElement('option');
    option.value = est.id;
    option.textContent = est.nome;
    estadoSelect.appendChild(option);
  });
}

async function carregarMunicipios(estadoId) {
  const municipioSelect = document.getElementById('municipioSelect');
  municipioSelect.innerHTML = `<option value="">Selecione um município</option>`;
  municipioSelect.disabled = true;

  const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`);
  const municipios = await resp.json();
  municipios.sort((a,b)=>a.nome.localeCompare(b.nome));
  municipios.forEach(mun=>{
    const option = document.createElement('option');
    option.value = mun.nome;
    option.textContent = mun.nome;
    municipioSelect.appendChild(option);
  });

  municipioSelect.disabled=false;
}

// ======================= EVENTOS =======================
document.getElementById('estado-select').addEventListener('change', e=>{
  const estadoId = e.target.value;
  if(estadoId) carregarMunicipios(estadoId);
});

document.getElementById('cidade-select').addEventListener('change', e=>{
  const btn = document.getElementById('buscarClimaBtn');
  btn.disabled = !e.target.value;
});

document.getElementById('buscarClimaBtn').addEventListener('click', ()=>{
  const cidadeEscolhida = document.getElementById('cidade-select').value;
  if(cidadeEscolhida){
    city = cidadeEscolhida;
    carregarPrevisao(city);
  }
});

// ======================= INICIALIZA =======================
carregarEstados();
carregarPrevisao();
renderFavorites();
renderHistory();
