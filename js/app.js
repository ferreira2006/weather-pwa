document.addEventListener("DOMContentLoaded", () => {

  // ======================= CONFIGURAÇÃO =======================
  const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";
  let city = "São Miguel do Oeste";
  const horariosPadraoFuturos = [6, 12, 18];

  // ======================= UTILITÁRIOS =======================
  function capitalizeWords(str) {
    return str.split(' ').map(word =>
      word.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-')
    ).join(' ');
  }

  function climaGradient(desc) {
    const d = desc.toLowerCase();
    if(d.includes("céu limpo")||d.includes("limpo")) return "clear";
    if(d.includes("nuvens")||d.includes("nublado")) return "clouds";
    if(d.includes("chuva")||d.includes("garoa")) return "rain";
    if(d.includes("trovoada")) return "thunderstorm";
    if(d.includes("neve")) return "snow";
    return "clouds";
  }

  // ======================= DARK/LIGHT MODE =======================
  const themeBtn = document.getElementById("theme-toggle");
  if(themeBtn){
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      document.body.classList.toggle("light");
      themeBtn.setAttribute("aria-pressed", document.body.classList.contains("dark"));
    });
  }

  // ======================= CARREGAR ESTADOS E MUNICÍPIOS =======================
  async function carregarEstados() {
    const estadoSelect = document.getElementById('estado-select');
    if(!estadoSelect) return;
    const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
    const estados = await resp.json();
    estados.sort((a,b)=>a.nome.localeCompare(b.nome));
    estados.forEach(est => {
      const opt = document.createElement('option');
      opt.value = est.id;
      opt.textContent = est.nome;
      estadoSelect.appendChild(opt);
    });
  }

  async function carregarMunicipios(estadoId) {
    const municipioSelect = document.getElementById('cidade-select');
    if(!municipioSelect) return;
    municipioSelect.innerHTML = `<option value="">Selecione a cidade</option>`;
    municipioSelect.disabled = true;

    const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`);
    const municipios = await resp.json();
    municipios.sort((a,b)=>a.nome.localeCompare(b.nome));
    municipios.forEach(mun => {
      const opt = document.createElement('option');
      opt.value = mun.nome;
      opt.textContent = mun.nome;
      municipioSelect.appendChild(opt);
    });

    municipioSelect.disabled = false;
  }

  // ======================= EVENTOS SELECTS =======================
  const estadoSelect = document.getElementById('estado-select');
  if(estadoSelect){
    estadoSelect.addEventListener('change', e => {
      if(e.target.value) carregarMunicipios(e.target.value);
    });
  }

  const cidadeSelect = document.getElementById('cidade-select');
  if(cidadeSelect){
    cidadeSelect.addEventListener('change', e => {
      const btn = document.getElementById('buscarClimaBtn');
      if(btn) btn.disabled = !e.target.value;
    });
  }

  const buscarBtn = document.getElementById('buscarClimaBtn');
  if(buscarBtn){
    buscarBtn.addEventListener('click', () => {
      const cidadeEscolhida = document.getElementById('cidade-select').value;
      if(cidadeEscolhida){
        city = cidadeEscolhida;
        carregarPrevisao(city);
        adicionarHistorico(city);
      }
    });
  }

  // ======================= HISTÓRICO =======================
  function adicionarHistorico(cidade) {
    let history = JSON.parse(localStorage.getItem("history")||"[]");
    if(!history.includes(cidade)){
      history.unshift(cidade);
      if(history.length>10) history.pop();
      localStorage.setItem("history", JSON.stringify(history));
      renderHistorico();
    }
  }

  function renderHistorico() {
    const historyList = document.getElementById("history-list");
    if(!historyList) return;
    const history = JSON.parse(localStorage.getItem("history")||"[]");
    historyList.innerHTML = "";
    history.forEach(cidade => {
      const li = document.createElement("li");
      li.tabIndex=0;
      li.textContent = cidade;
      li.addEventListener("click", ()=> {
        city = cidade;
        carregarPrevisao(cidade);
      });
      historyList.appendChild(li);
    });
  }
  renderHistorico();

  // ======================= FAVORITOS =======================
  function carregarFavoritos() {
    const favList = document.getElementById("favorites-list");
    if(!favList) return;
    const favs = JSON.parse(localStorage.getItem("favorites")||"[]");
    favList.innerHTML = "";
    favs.forEach(cidade=>{
      const li = document.createElement("li");
      li.tabIndex=0;
      li.textContent = cidade;
      li.addEventListener("click", ()=>{
        city = cidade;
        carregarPrevisao(cidade);
      });
      li.addEventListener("contextmenu", e=>{
        e.preventDefault();
        abrirModalRemocao(cidade);
      });
      favList.appendChild(li);
    });
  }

  function adicionarFavorito(cidade){
    let favs = JSON.parse(localStorage.getItem("favorites")||"[]");
    if(!favs.includes(cidade)){
      favs.push(cidade);
      localStorage.setItem("favorites", JSON.stringify(favs));
      carregarFavoritos();
      showToast(`${cidade} adicionada aos favoritos!`);
    }
  }

  function removerFavorito(cidade){
    let favs = JSON.parse(localStorage.getItem("favorites")||"[]");
    favs = favs.filter(c=>c!==cidade);
    localStorage.setItem("favorites", JSON.stringify(favs));
    carregarFavoritos();
  }

  // ======================= MODAL =======================
  const modal = document.getElementById("confirm-modal");
  function abrirModalRemocao(cidade){
    if(!modal) return;
    modal.hidden = false;
    document.getElementById("confirm-yes").onclick = ()=>{
      removerFavorito(cidade);
      modal.hidden=true;
    }
    document.getElementById("confirm-no").onclick = ()=>{ modal.hidden=true; }
  }
  carregarFavoritos();

  // ======================= TOAST =======================
  function showToast(msg){
    const toast = document.getElementById("toast");
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(()=>toast.classList.remove("show"),2500);
  }

  // ======================= PREVISÃO DO TEMPO =======================
  async function carregarPrevisao(cidadeEscolhida = city){
    const weather = document.getElementById("weather");
    if(weather) weather.classList.add("loading");
    try{
      const resp = await fetch(`${backendUrl}?city=${encodeURIComponent(cidadeEscolhida)}`);
      if(!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
      const dados = await resp.json();
      if(!dados.list) throw new Error("Dados inválidos");

      document.getElementById("city-name").textContent = cidadeEscolhida;
      const diasMap = agruparPorDia(dados.list);
      prepararCards(diasMap);
      atualizarWeatherCard(dados.list[0]); 
    }catch(err){
      console.error(err);
      if(weather) weather.classList.add("error");
      const errMsg = document.getElementById("weather-error");
      if(errMsg) errMsg.textContent = "Não foi possível carregar a previsão.";
    }finally{
      if(weather) weather.classList.remove("loading","error");
    }
  }

  // ======================= AGRUPAR POR DIA =======================
  function agruparPorDia(list){
    const agora = new Date();
    const formatterData = new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo", day:"2-digit", month:"2-digit", year:"numeric"});
    const formatterHora = new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo", hour:"numeric", hour12:false});
    const formatterDiaSemana = new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo", weekday:"long"});
    const hojeStr = formatterData.format(agora);

    const diasMap = new Map();

    list.forEach(item=>{
      const data = new Date(item.dt*1000);
      const dataLocalStr = formatterData.format(data);
      const horaLocal = parseInt(formatterHora.format(data));
      const diaSemana = capitalizeWords(formatterDiaSemana.format(data));
      const isHoje = dataLocalStr===hojeStr;

      if(!diasMap.has(dataLocalStr)) diasMap.set(dataLocalStr,{diaSemana, horarios:[], isToday:isHoje});
      diasMap.get(dataLocalStr).horarios.push({
        hora:horaLocal,
        desc:item.weather[0].description,
        temp:Math.round(item.main.temp),
        feels_like:Math.round(item.main.feels_like),
        humidity:item.main.humidity,
        pop:Math.round((item.pop||0)*100),
        icon:item.weather[0].icon,
        fromTomorrow:false
      });
    });
    return diasMap;
  }

  // ======================= PREPARAÇÃO E RENDER CARDS =======================
  function prepararCards(diasMap){
    const agora = new Date();
    const diasOrdenados = Array.from(diasMap.keys()).sort();
    const hojeStr = diasOrdenados[0];
    const hojeData = diasMap.get(hojeStr);

    // HOJE
    if(hojeData){
      let proximos = hojeData.horarios
        .sort((a,b)=>a.hora-b.hora)
        .filter(h=>h.hora>agora.getHours());
      const indiceHoje = diasOrdenados.indexOf(hojeStr);
      const amanhaData = diasMap.get(diasOrdenados[indiceHoje+1]);
      if(amanhaData && proximos.length<4){
        amanhaData.horarios.sort((a,b)=>a.hora-b.hora).forEach(h=>{
          if(proximos.length<4) proximos.push({...h, fromTomorrow:true});
        });
      }
      hojeData.horarios = proximos.slice(0,4);
    }

    // FUTUROS
    diasOrdenados.slice(1).forEach(dia=>{
      const dataDia = diasMap.get(dia);
      dataDia.horarios = dataDia.horarios
        .filter(h=>horariosPadraoFuturos.includes(h.hora))
        .sort((a,b)=>a.hora-b.hora);
    });

    renderCards(diasOrdenados,diasMap);
  }

  function renderCards(diasOrdenados,diasMap){
    let cardsDiv = document.getElementById("cards");
    if(!cardsDiv){
      cardsDiv = document.createElement("div");
      cardsDiv.id="cards";
      cardsDiv.className="cards";
      document.querySelector("main")?.appendChild(cardsDiv);
    }
    cardsDiv.innerHTML="";

    let tooltip = document.querySelector(".tooltip");
    if(!tooltip){
      tooltip = document.createElement("div");
      tooltip.className="tooltip";
      document.body.appendChild(tooltip);
    }

    diasOrdenados.slice(0,4).forEach(dia=>{
      const dataDia = diasMap.get(dia);
      const card = document.createElement("div");
      card.className="card" + (dataDia.isToday?" today":"");

      const titulo = document.createElement("h2");
      titulo.textContent = `${dataDia.diaSemana} - ${dia}`;
      card.appendChild(titulo);

      dataDia.horarios.forEach(p=>{
        const horarioDiv = document.createElement("div");
        horarioDiv.className="horario";
        horarioDiv.style.background = "";

        horarioDiv.innerHTML=`
          <strong>${p.hora}h</strong>
          ${p.fromTomorrow?'<span style="font-size:0.8em; margin-left:4px;">Amanhã</span>':""}
          <img src="https://openweathermap.org/img/wn/${p.icon}.png" alt="${p.desc}">
          <span class="desc">${capitalizeWords(p.desc)}</span>
          <span class="temp">${p.temp}°C</span>
        `;

        horarioDiv.addEventListener("mousemove",e=>{
          tooltip.innerHTML = `Sensação: ${p.feels_like}°C<br>Umidade: ${p.humidity}%<br>Chuva: ${p.pop}%`;
          tooltip.style.opacity=1;
          let left=e.clientX+12, top=e.clientY+12;
          if(left+tooltip.offsetWidth>window.innerWidth) left=window.innerWidth-tooltip.offsetWidth-4;
          if(top+tooltip.offsetHeight>window.innerHeight) top=window.innerHeight-tooltip.offsetHeight-4;
          tooltip.style.left=left+"px";
          tooltip.style.top=top+"px";
        });
        horarioDiv.addEventListener("mouseleave",()=>tooltip.style.opacity=0);

        card.appendChild(horarioDiv);
      });

      cardsDiv.appendChild(card);
    });
  }

  function atualizarWeatherCard(item){
    const weather = document.getElementById("weather");
    if(!weather) return;
    document.getElementById("temp").textContent = `${Math.round(item.main.temp)}°C`;
    document.getElementById("desc").textContent = capitalizeWords(item.weather[0].description);
    document.getElementById("details").innerHTML = `Sensação: ${Math.round(item.main.feels_like)}°C<br>Umidade: ${item.main.humidity}%<br>Chuva: ${Math.round((item.pop||0)*100)}%`;

    const iconDiv = document.getElementById("icon");
    const tipo = climaGradient(item.weather[0].description);
    if(iconDiv) iconDiv.className = `weather-icon ${tipo}`;
    document.body.classList.remove("bg-clear","bg-clouds","bg-rain","bg-thunderstorm","bg-snow");
    document.body.classList.add(`bg-${tipo}`);
  }

  // ======================= INICIALIZA =======================
  carregarEstados();
  carregarPrevisao();

});
