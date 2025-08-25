// ======================= CONFIGURAÇÕES =======================
const coresSemana = ['#FFCDD2','#C8E6C9','#BBDEFB','#FFF9C4','#D1C4E9','#FFE0B2','#B2DFDB','#F8BBD0'];
const apiKey = "SUA_API_KEY";
const cidade = "São Paulo,BR";
const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

const cardsDiv = document.getElementById("cards");
const tooltip = document.getElementById("tooltip");
const hojeData = new Date();
const amanhaData = new Date(hojeData);
amanhaData.setDate(hojeData.getDate() + 1);
const amanhaStr = amanhaData.toISOString().split("T")[0];

// ======================= FUNÇÕES AUXILIARES =======================
function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function climaGradient(desc) {
  if (desc.includes("chuva")) return "linear-gradient(135deg, #4facfe, #00f2fe)";
  if (desc.includes("nublado")) return "linear-gradient(135deg, #bdc3c7, #2c3e50)";
  if (desc.includes("sol") || desc.includes("claro")) return "linear-gradient(135deg, #f6d365, #fda085)";
  return "linear-gradient(135deg, #e0eafc, #cfdef3)";
}

// ======================= BUSCAR DADOS =======================
fetch(url)
  .then(res => res.json())
  .then(data => {
    const list = data.list;
    const tzOffset = data.city.timezone;
    const diasMap = new Map();

    // --- Agrupar por dias ---
    list.forEach(item => {
      const dataUTC = new Date(item.dt_txt + " UTC");
      const dataLocal = new Date(dataUTC.getTime() + tzOffset * 1000);
      const dataLocalStr = dataLocal.toISOString().split("T")[0];
      const hora = dataLocal.getHours();

      const hojeStr = hojeData.toISOString().split("T")[0];
      const isToday = dataLocalStr === hojeStr;

      // cria o dia caso não exista ainda
      if (!diasMap.has(dataLocalStr)) {
        const nomesDias = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
        const diaSemana = nomesDias[dataLocal.getDay()];
        diasMap.set(dataLocalStr, {
          diaSemana,
          horarios: [],
          isToday
        });
      }

      const dia = diasMap.get(dataLocalStr);

      // marcar se é até 6h de amanhã mas vai junto no card de hoje
      const fromTomorrow = !isToday && dataLocalStr === amanhaStr && hora <= 6;

      dia.horarios.push({
        hora,
        desc: item.weather[0].description,
        temp: Math.round(item.main.temp),
        feels_like: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        pop: Math.round(item.pop * 100),
        icon: item.weather[0].icon,
        fromTomorrow
      });
    });

    // --- Criar cards ordenados ---
    const diasOrdenados = Array.from(diasMap.keys()).sort();
    diasOrdenados.forEach(diaStr => {
      const dataDia = diasMap.get(diaStr);

      const card = document.createElement("div");
      card.className = "card";

      const titulo = document.createElement("h2");
      titulo.textContent = `${dataDia.diaSemana} - ${diaStr}`;
      card.appendChild(titulo);

      // horários filtrados
      let horarios = dataDia.horarios;
      if (dataDia.isToday) {
        const horaAgora = hojeData.getHours();
        horarios = horarios.filter(h => h.hora >= horaAgora || h.fromTomorrow);
      }

      horarios.forEach(p => {
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

        horarioDiv.addEventListener("mousemove", e => {
          tooltip.innerHTML = `
            Sensação: ${p.feels_like}°C<br>
            Umidade: ${p.humidity}%<br>
            Chuva: ${p.pop}%
          `;
          tooltip.style.opacity = 1;
          let left = e.clientX + 12, top = e.clientY + 12;
          if (left + tooltip.offsetWidth > window.innerWidth) left = window.innerWidth - tooltip.offsetWidth - 4;
          if (top + tooltip.offsetHeight > window.innerHeight) top = window.innerHeight - tooltip.offsetHeight - 4;
          tooltip.style.left = left + "px";
          tooltip.style.top = top + "px";
        });
        horarioDiv.addEventListener("mouseleave", () => {
          tooltip.style.opacity = 0;
        });

        card.appendChild(horarioDiv);
      });

      cardsDiv.appendChild(card);
    });
  })
  .catch(err => console.error("Erro ao carregar previsão:", err));
