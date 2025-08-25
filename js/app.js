const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";
const city = "São Miguel do Oeste";

function capitalizeWords(str) {
  return str.split(' ').map(word => word.split('-').map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join('-')).join(' ');
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
      const data = new Date(item.dt*1000);
      const dataLocalStr = new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo", day:"2-digit", month:"2-digit", year:"numeric"}).format(data);
      const horaLocal = parseInt(new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo", hour:"numeric", hour12:false}).format(data));
      const diaSemana = capitalizeWords(new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo", weekday:"long"}).format(data));
      const isHoje = dataLocalStr === new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo", day:"2-digit", month:"2-digit", year:"numeric"}).format(agora);

      // Filtrar horários
      if(isHoje && horaLocal <= agora.getHours()) return;
      if(!isHoje && !horariosPadraoFuturos.includes(horaLocal)) return;

      if(!diasMap.has(dataLocalStr)) diasMap.set(dataLocalStr,{diaSemana, horarios:[]});
      diasMap.get(dataLocalStr).horarios.push({
        hora: horaLocal,
        desc: item.weather[0].description,
        temp: Math.round(item.main.temp),
        feels_like: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        pop: Math.round((item.pop||0)*100),
        icon: item.weather[0].icon,
        fromTomorrow: !isHoje
      });
    });

    // Card de hoje: pegar os 4 próximos horários
    const hojeStr = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(agora);

    const hojeData = diasMap.get(hojeStr);
    if (hojeData) {
      let horariosHoje = hojeData.horarios.sort((a, b) => a.hora - b.hora);
      const proximos = [];
      for (const h of horariosHoje) {
        if (h.hora > agora.getHours()) proximos.push(h);
      }

      const diasOrdenados = Array.from(diasMap.keys()).sort();
      const indiceHoje = diasOrdenados.indexOf(hojeStr);
      const amanhaData = diasMap.get(diasOrdenados[indiceHoje + 1]);

      let i = 0;
      while (proximos.length < 4 && amanhaData && i < amanhaData.horarios.length) {
        const nh = { ...amanhaData.horarios[i], fromTomorrow: true };
        proximos.push(nh);
        i++;
      }

      hojeData.horarios = proximos.slice(0, 4);
    }

    const diasOrdenados = Array.from(diasMap.keys()).slice(0,4);
    const cardsDiv = document.getElementById("cards");
    cardsDiv.innerHTML = "";

    let tooltip = document.querySelector(".tooltip");
    if(!tooltip){
      tooltip = document.createElement("div");
      tooltip.className="tooltip";
      document.body.appendChild(tooltip);
    }

        diasOrdenados.forEach(dia=>{

  } catch(err){
    console.error("Erro ao carregar previsão:", err);
    document.getElementById("cards").innerHTML=`<p>Não foi possível carregar a previsão.</p>`;
  }
}

carregarPrevisao();
