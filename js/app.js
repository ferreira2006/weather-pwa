const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";
const city = "São Miguel do Oeste";

function capitalizeWords(str) {
  return str.split(' ').map(word => word.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-')).join(' ');
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

async function carregarPrevisao() {
  try {
    const resp = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if(!resp.ok) throw new Error(`Erro HTTP: ${resp.status}`);
    const dados = await resp.json();
    if(!dados.list) throw new Error("Resposta inesperada do backend");

    const agora = new Date();
    const horariosPadraoFuturos = [6,12,18];
    const diasMap = new Map();

    // Agrupar previsões por dia
    dados.list.forEach(item => {
      const data = new Date(item.dt * 1000);
      const dataStr = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(data);
      const hora = parseInt(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12:false }).format(data));
      const diaSemana = capitalizeWords(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" }).format(data));
      const isHoje = dataStr === new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day:"2-digit", month:"2-digit", year:"numeric" }).format(agora);

      // Filtrar horários
      if(isHoje && hora <= agora.getHours()) return;
      if(!isHoje && !horariosPadraoFuturos.includes(hora)) return;

      if(!diasMap.has(dataStr)) diasMap.set(dataStr, { diaSemana, horarios: [] });
      diasMap.get(dataStr).horarios.push({
        hora,
        desc: item.weather[0].description,
        temp: Math.round(item.main.temp),
        feels_like: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        pop: Math.round((item.pop || 0) * 100),
        icon: item.weather[0].icon,
        isFromTomorrow: !isHoje
      });
    });

    // Ajustar card de hoje: pegar 4 próximos horários
    const hojeStr = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day:"2-digit", month:"2-digit", year:"numeric" }).format(agora);
    const hojeData = diasMap.get(hojeStr);
    if(hojeData){
      hojeData.horarios.sort((a,b)=>a.hora-b.hora);
      let proximos = hojeData.horarios.filter(h => h.hora > agora.getHours());

      // se faltar horários, pegar do próximo dia
      const diasOrdenados = Array.from(diasMap.keys()).sort();
      const indiceHoje = diasOrdenados.indexOf(hojeStr);
      const amanhaData = diasMap.get(diasOrdenados[indiceHoje+1]);
      let i=0;
      while(proximos.length < 4 && amanhaData && i < amanhaData.horarios.length){
        // marcar apenas para o card de hoje que este horário vem do próximo dia
        proximos.push({ ...amanhaData.horarios[i], isFromTomorrow: true });
        i++;
      }

      hojeData.horarios = proximos.slice(0,4);
    }

    // Renderizar cards
    const cardsDiv = document.getElementById("cards");
    cardsDiv.innerHTML = "";

    let tooltip = document.querySelector(".tooltip");
    if(!tooltip){
      tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      document.body.appendChild(tooltip);
    }

    Array.from(diasMap.keys()).sort().slice(0,4).forEach(dia=>{
      const dataDia = diasMap.get(dia);
      const card = document.createElement("div");
      card.className = "card";
      if(dia === hojeStr) card.classList.add("today");

      const titulo = document.createElement("h2");
      titulo.textContent = `${dataDia.diaSemana} - ${dia}`;
      card.appendChild(titulo);

      dataDia.horarios.forEach(h=>{
        const horarioDiv = document.createElement("div");
        horarioDiv.className = "horario";
        horarioDiv.style.background = climaGradient(h.desc);

        let label = '';
        // mostrar "Amanhã" somente para horários do próximo dia que aparecem no card de hoje
        if(h.isFromTomorrow && dia === hojeStr) label = `<span style="font-size:0.8em; margin-left:4px;">Amanhã</span>`;

        horarioDiv.innerHTML = `
          <strong>${h.hora}h</strong>
          ${label}
          <img src="https://openweathermap.org/img/wn/${h.icon}.png" alt="${h.desc}">
          <span class="desc">${capitalizeWords(h.desc)}</span>
          <span class="temp">${h.temp}°C</span>
        `;

        horarioDiv.addEventListener("mousemove", e=>{
          tooltip.innerHTML = `Sensação: ${h.feels_like}°C<br>Umidade: ${h.humidity}%<br>Chuva: ${h.pop}%`;
          tooltip.style.opacity = 1;
          let left = e.clientX+12, top = e.clientY+12;
          if(left+tooltip.offsetWidth>window.innerWidth) left = window.innerWidth-tooltip.offsetWidth-4;
          if(top+tooltip.offsetHeight>window.innerHeight) top = window.innerHeight-tooltip.offsetHeight-4;
          tooltip.style.left = left+"px";
          tooltip.style.top = top+"px";
        });
        horarioDiv.addEventListener("mouseleave", ()=> tooltip.style.opacity=0);

        card.appendChild(horarioDiv);
      });

      cardsDiv.appendChild(card);
    });

  } catch(err){
    console.error("Erro ao carregar previsão:", err);
    document.getElementById("cards").innerHTML = `<p>Não foi possível carregar a previsão.</p>`;
  }
}

carregarPrevisao();
