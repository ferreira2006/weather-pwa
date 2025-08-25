// ======================= CONFIGURAÇÕES =======================
const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";
const city = "São Miguel do Oeste"; 

function capitalizeWords(str) {
  return str
    .split(" ")
    .map(word =>
      word
        .split("-")
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join("-")
    )
    .join(" ");
}

function climaGradient(desc) {
  desc = desc.toLowerCase();
  if (desc.includes("chuva")) return "from-blue-400 to-gray-600";
  if (desc.includes("nublado")) return "from-gray-400 to-gray-700";
  if (desc.includes("sol") || desc.includes("céu limpo"))
    return "from-yellow-400 to-orange-500";
  return "from-green-300 to-blue-500";
}

async function carregarPrevisao() {
  try {
    const resp = await fetch(`${backendUrl}?city=${encodeURIComponent(city)}`);
    const dados = await resp.json();

    if (!dados.list) {
      console.error("Formato inesperado do backend:", dados);
      return;
    }

    const diasMap = new Map();

    // Formatadores
    const formatterData = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formatterHora = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    });
    const formatterDiaSemana = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      timeZone: "America/Sao_Paulo",
    });

    const hojeStr = formatterData.format(new Date());
    const horariosPadraoFuturos = [6, 12, 18];

    // Agrupar previsões por dia
    dados.list.forEach(item => {
      const data = new Date(item.dt * 1000);
      const dataLocalStr = formatterData.format(data);
      const horaLocal = parseInt(formatterHora.format(data));
      const diaSemana = capitalizeWords(formatterDiaSemana.format(data));
      const isHoje = dataLocalStr === hojeStr;

      // Se não for hoje, aplicar filtro 6, 12 e 18
      if (!isHoje && !horariosPadraoFuturos.includes(horaLocal)) return;

      if (!diasMap.has(dataLocalStr)) {
        diasMap.set(dataLocalStr, {
          dia: `${diaSemana}, ${dataLocalStr}`,
          horarios: [],
          isToday: isHoje,
        });
      }

      diasMap.get(dataLocalStr).horarios.push({
        hora: horaLocal,
        desc: capitalizeWords(item.weather[0].description),
        temp: Math.round(item.main.temp),
        feels_like: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        pop: Math.round((item.pop || 0) * 100),
        icon: item.weather[0].icon,
      });
    });

    const dias = Array.from(diasMap.values());
    const cards = [];

    // ------------------- Card de Hoje -------------------
    if (dias.length > 0) {
      const hojeData = dias.find(d => d.isToday);
      const agora = new Date();
      let proximos = hojeData.horarios
        .sort((a, b) => a.hora - b.hora)
        .filter(h => h.hora > agora.getHours());

      proximos = proximos.slice(0, 4); // pega só os próximos 4
      cards.push({ dia: hojeData.dia, horarios: proximos });
    }

    // ------------------- Cards Futuros -------------------
    dias
      .filter(d => !d.isToday)
      .forEach(d => {
        cards.push({ dia: d.dia, horarios: d.horarios });
      });

    renderCards(cards);
  } catch (e) {
    console.error("Erro ao carregar previsão:", e);
  }
}

function renderCards(cards) {
  const container = document.getElementById("cards");
  container.innerHTML = "";

  cards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className =
      "p-4 m-2 rounded-2xl shadow-md bg-gradient-to-br " +
      climaGradient(card.horarios[0]?.desc || "");

    const titulo = document.createElement("h2");
    titulo.className = "text-xl font-bold mb-2 capitalize";
    titulo.innerText = card.dia;
    cardEl.appendChild(titulo);

    const horariosEl = document.createElement("div");
    horariosEl.className = "grid grid-cols-2 gap-2";

    card.horarios.forEach(h => {
      const hEl = document.createElement("div");
      hEl.className =
        "flex items-center space-x-2 bg-white/30 p-2 rounded-lg";

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
