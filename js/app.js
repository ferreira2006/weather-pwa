// ======================= CONFIGURAÇÕES =======================
const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";
const city = "São Miguel do Oeste"; // pode trocar para "São Paulo" etc.

function capitalizeWords(str) {
  return str.split(' ').map(word => word.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-')).join(' ');
}

function climaGradient(desc) {
  desc = desc.toLowerCase();
  if (desc.includes("chuva")) return "from-blue-400 to-gray-600";
  if (desc.includes("nublado")) return "from-gray-400 to-gray-700";
  if (desc.includes("sol") || desc.includes("céu limpo")) return "from-yellow-400 to-orange-500";
  return "from-green-300 to-blue-500";
}

async function carregarPrevisao() {
  try {
    const resp = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    const dados = await resp.json();

    const diasMap = {};

    dados.forEach(item => {
      const dataHora = new Date(item.dt_txt);
      const dia = dataHora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
      const horaLocal = dataHora.getHours();

      // Preserva todos os horários do backend
      if(!diasMap[dia]) diasMap[dia] = { dia, horarios: [] };
      diasMap[dia].horarios.push({
        hora: horaLocal,
        temp: Math.round(item.main.temp),
        desc: capitalizeWords(item.weather[0].description),
        icon: item.weather[0].icon
      });
    });

    const dias = Object.values(diasMap);
    const cards = [];

    // ------------------- Card de Hoje -------------------
    if(dias.length > 0){
      const hojeData = dias[0];
      const agora = new Date();

      let proximos = hojeData.horarios
        .sort((a,b) => a.hora - b.hora)
        .filter(h => h.hora > agora.getHours()); // apenas horários futuros

      proximos = proximos.slice(0,4); // pega só os próximos 4

      cards.push({ dia: hojeData.dia, horarios: proximos });
    }

    // ------------------- Cards Futuros -------------------
    const horariosPadraoFuturos = [6,12,18]; // só aqui entra a regra
    for(let i=1; i<dias.length; i++){
      const d = dias[i];
      const horariosFiltrados = d.horarios.filter(h => horariosPadraoFuturos.includes(h.hora));
      cards.push({ dia: d.dia, horarios: horariosFiltrados });
    }

    renderCards(cards);

  } catch (e) {
    console.error("Erro ao carregar previsão:", e);
  }
}

function renderCards(cards) {
  const container = document.getElementById("previsao");
  container.innerHTML = "";

  cards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className = "p-4 m-2 rounded-2xl shadow-md bg-gradient-to-br " + climaGradient(card.horarios[0]?.desc || "");

    const titulo = document.createElement("h2");
    titulo.className = "text-xl font-bold mb-2 capitalize";
    titulo.innerText = card.dia;
    cardEl.appendChild(titulo);

    const horariosEl = document.createElement("div");
    horariosEl.className = "grid grid-cols-2 gap-2";

    card.horarios.forEach(h => {
      const hEl = document.createElement("div");
      hEl.className = "flex items-center space-x-2 bg-white/30 p-2 rounded-lg";

      const hora = document.createElement("span");
      hora.className = "font-semibold";
      hora.innerText = `${h.hora}h`;

      const temp = document.createElement("span");
      temp.innerText = `${h.temp}°C`;

      const desc = document.createElement("span");
      desc.className = "italic text-sm";
      desc.innerText = h.desc;

      hEl.appendChild(hora);
      hEl.appendChild(temp);
      hEl.appendChild(desc);

      horariosEl.appendChild(hEl);
    });

    cardEl.appendChild(horariosEl);
    container.appendChild(cardEl);
  });
}

carregarPrevisao();
