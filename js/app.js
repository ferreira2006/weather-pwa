const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";
const city = "São Miguel do Oeste";

// ======================== Funções utilitárias ========================
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

// ======================== Carregar previsão ========================
async function carregarPrevisao() {
  try {
    const resp = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    if(!resp.ok) throw new Error(`Erro HTTP: ${resp.status}`);
    const dados = await resp.json();
    if(!dados.list) throw new Error("Resposta inesperada do backend");

    const agora = new Date();
    const formatterData = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day:"2-digit", month:"2-digit", year:"numeric" });
    const formatterHora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour:"numeric", hour12:false });
    const formatterDiaSemana = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday:"long" });
    const hojeStr = formatterData.format(agora);

    const horariosPadraoFuturos = [6,12,18];
    const diasMap = new Map();

    // ======================== Agrupar previsões ========================
    dados.list.forEach(item => {
      const data = new Date(item.dt*1000);
      const dataLocalStr = formatterData.format(data);
      const horaLocal = parseInt(formatterHora.format(data));
      const diaSemana = capitalizeWords(formatterDiaSemana.format(data));
      const isHoje = dataLocalStr === hojeStr;

      // Filtro de horários
      if(isHoje && horaLocal <= agora.getHours()) return;
      if(!isHoje && !horariosPadraoFuturos.includes(horaLocal)) return;

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

    // ======================== Preparar card de hoje ========================
    const hojeData = diasMap.get(hojeStr);
    const diasOrdenados = Array.from(diasMap.keys()).sort();

    if(hojeData) {
      let proximos = hojeData.horarios.sort((a,b)=>a.hora-b.hora)
                                     .filter(h => h.hora > agora.getHours());

      // Adiciona madrugada do dia seguinte (<6h) se faltar horários
      const indiceHoje = diasOrdenados.indexOf(hojeStr);
      const amanhaData = diasMap.get(diasOrdenados[indiceHoje + 1]);
      if(amanhaData && proximos.length < 4) {
        amanhaData.horarios.filter(h => h.hora < 6).forEach(h => {
          if(proximos.length < 4) proximos.push({ ...h, fromTomorrow: true });
        });

        const horario6h = amanhaData.horarios.find(h => h.hora === 6);
        if(horario6h && proximos.length < 4) proximos.push({ ...horario6h, fromTomorrow: true });
      }

      hojeData.horarios = proximos.slice(0,4);
    }

    // ======================== Renderização ========================
    const cardsDiv = document.getElementById("cards");
    cardsDiv.innerHTML = "";

    // Tooltip único
    let tooltip = document.querySelector(".tooltip");
    if(!tooltip){
      tooltip = document.createElement("div");
      tooltip.className="tooltip";
      document.body.appendChild(tooltip);
    }

    // Renderizar cada card
    diasOrdenados.slice(0,4).forEach(dia => {
      const dataDia = diasMap.get(dia);
      const card = document.createElement("div");
      card.className = "card";

      const titulo = document.createElement("h2");
      titulo.textContent = `${dataDia.diaSemana} - ${dia}`;
      card.appendChild(titulo);

      dataDia.horarios.forEach(p => {
        if(!p) return;
        const horarioDiv = document.createElement("div");
        horarioDiv.className = "horario";
        horarioDiv.style.background = climaGradient(p.desc);

        const mostrarAmanha = dataDia.isToday && p.fromTomorrow;

        horarioDiv.innerHTML = `
          <strong>${p.hora}h</strong>
          ${mostrarAmanha ? `<span style="font-size:0.8em; margin-left:4px;">Amanhã</span>` : ""}
          <img src="https://openweathermap.org/img/wn/${p.icon}.png" alt="${p.desc}">
          <span class="desc">${capitalizeWords(p.desc)}</span>
          <span class="temp">${p.temp}°C</span>
        `;

        horarioDiv.addEventListener("mousemove", e => {
          tooltip.innerHTML = `Sensação: ${p.feels_like}°C<br>Umidade: ${p.humidity}%<br>Chuva: ${p.pop}%`;
          tooltip.style.opacity = 1;
          let left = e.clientX + 12, top = e.clientY + 12;
          if (left + tooltip.offsetWidth > window.innerWidth) left = window.innerWidth - tooltip.offsetWidth - 4;
          if (top + tooltip.offsetHeight > window.innerHeight) top = window.innerHeight - tooltip.offsetHeight - 4;
          tooltip.style.left = left + "px";
          tooltip.style.top = top + "px";
        });
        horarioDiv.addEventListener("mouseleave", () => tooltip.style.opacity = 0);

        card.appendChild(horarioDiv);
      });

      cardsDiv.appendChild(card);
    });

  } catch(err) {
    console.error("Erro ao carregar previsão:", err);
    document.getElementById("cards").innerHTML=`<p>Não foi possível carregar a previsão.</p>`;
  }
}

carregarPrevisao();
