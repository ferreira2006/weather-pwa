// ======================= CONFIGURAÇÕES =======================
let city = 'São Miguel do Oeste'; // cidade padrão
const backendUrl = 'https://weather-backend-hh3w.onrender.com/forecast';
const horariosPadraoFuturos = [6, 12, 18]; // horários padrão para dias futuros

// ======================= UTILITÁRIOS =======================
function capitalizeWords(str) {
  return str
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('-')
    )
    .join(' ');
}

function climaGradient(desc) {
  const d = desc.toLowerCase();
  if (d.includes('céu limpo') || d.includes('limpo'))
    return 'linear-gradient(90deg, #fff59d, #ffe57f)';
  if (d.includes('nuvens') || d.includes('nublado'))
    return 'linear-gradient(90deg, #b0bec5, #90a4ae)';
  if (d.includes('chuva') || d.includes('garoa'))
    return 'linear-gradient(90deg, #90caf9, #64b5f6)';
  if (d.includes('trovoada')) return 'linear-gradient(90deg, #ce93d8, #ba68c8)';
  if (d.includes('neve')) return 'linear-gradient(90deg, #e1f5fe, #b3e5fc)';
  if (
    d.includes('névoa') ||
    d.includes('neblina') ||
    d.includes('fumaça') ||
    d.includes('bruma')
  )
    return 'linear-gradient(90deg, #f5f5dc, #e0dfc6)';
  return 'linear-gradient(90deg, #b0bec5, #90a4ae)';
}

// ======================= CARREGA PREVISÃO =======================
async function carregarPrevisao(cidadeEscolhida = city) {
  try {
    const resp = await fetch(
      `${backendUrl}?city=${encodeURIComponent(cidadeEscolhida)}`
    );
    if (!resp.ok) throw new Error(`Erro HTTP: ${resp.status}`);
    const dados = await resp.json();
    if (!dados.list) throw new Error('Resposta inesperada do backend');

    // Atualiza o título da cidade no topo
    const titulo = document.getElementById('tituloCidade');
    if (titulo) titulo.textContent = `Previsão do Tempo - ${cidadeEscolhida}`;

    const diasMap = agruparPorDia(dados.list); // agrupa todos os horários por dia
    prepararCards(diasMap); // aplica regras e renderiza
  } catch (err) {
    console.error('Erro ao carregar previsão:', err);
    document.getElementById(
      'cards'
    ).innerHTML = `<p>Não foi possível carregar a previsão para "${cidadeEscolhida}".</p>`;
  }
}

// ======================= AGRUPA POR DIA =======================
function agruparPorDia(list) {
  const agora = new Date();
  const fmtData = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const fmtHora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hour12: false,
  });
  const fmtDiaSemana = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
  });
  const hojeStr = fmtData.format(agora);

  const diasMap = new Map();

  list.forEach((item) => {
    const data = new Date(item.dt * 1000);
    const diaStr = fmtData.format(data);
    const hora = parseInt(fmtHora.format(data));
    const diaSemana = capitalizeWords(fmtDiaSemana.format(data));
    const isHoje = diaStr === hojeStr;

    if (!diasMap.has(diaStr))
      diasMap.set(diaStr, { diaSemana, horarios: [], isToday: isHoje });

    diasMap.get(diaStr).horarios.push({
      hora,
      desc: item.weather[0].description,
      temp: Math.round(item.main.temp),
      feels_like: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      pop: Math.round((item.pop || 0) * 100),
      icon: item.weather[0].icon,
      fromTomorrow: false,
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

  // --- Card de hoje: mostrar apenas horários de 6 em 6 horas
  if (hojeData) {
    let proximos = hojeData.horarios
      .filter((h) => horariosPadraoFuturos.includes(h.hora) && h.hora > agora.getHours())
      .sort((a, b) => a.hora - b.hora);

    // Se não houver horários restantes no dia, pegar os horários padrão do dia seguinte
    if (proximos.length === 0) {
      const amanhaData = diasMap.get(diasOrdenados[1]);
      if (amanhaData) {
        proximos = amanhaData.horarios
          .filter((h) => horariosPadraoFuturos.includes(h.hora))
          .slice(0, 4)
          .map((h) => ({ ...h, fromTomorrow: true }));
      }
    }

    hojeData.horarios = proximos.slice(0, 4);
  }

  // --- Dias futuros: apenas horários padrão
  diasOrdenados.slice(1).forEach((dia) => {
    const dataDia = diasMap.get(dia);
    dataDia.horarios = dataDia.horarios
      .filter((h) => horariosPadraoFuturos.includes(h.hora))
      .sort((a, b) => a.hora - b.hora);
  });

  renderCards(diasOrdenados, diasMap);
}

// ======================= RENDERIZA CARDS =======================
function renderCards(diasOrdenados, diasMap) {
  const cardsDiv = document.getElementById('cards');
  cardsDiv.innerHTML = '';

  let tooltip = document.querySelector('.tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
  }

  diasOrdenados.slice(0, 4).forEach((dia) => {
    const dataDia = diasMap.get(dia);
    const card = document.createElement('div');
    card.className = 'card';

    const titulo = document.createElement('h2');
    titulo.textContent = `${dataDia.diaSemana} - ${dia}`;
    card.appendChild(titulo);

    dataDia.horarios.forEach((p) => {
      const hDiv = document.createElement('div');
      hDiv.className = 'horario';
      hDiv.style.background = climaGradient(p.desc);

      hDiv.innerHTML = `
        <strong>${p.hora}h</strong>
        ${p.fromTomorrow ? `<span style="font-size:0.8em; margin-left:4px;">Amanhã</span>` : ''}
        <img src="https://openweathermap.org/img/wn/${p.icon}.png" alt="${p.desc}">
        <span class="desc">${capitalizeWords(p.desc)}</span>
        <span class="temp">${p.temp}°C</span>
      `;

      // Tooltip
      hDiv.addEventListener('mousemove', (e) => {
        tooltip.innerHTML = `Sensação: ${p.feels_like}°C<br>Umidade: ${p.humidity}%<br>Chuva: ${p.pop}%`;
        tooltip.style.opacity = 1;
        let left = e.clientX + 12,
          top = e.clientY + 12;
        if (left + tooltip.offsetWidth > window.innerWidth)
          left = window.innerWidth - tooltip.offsetWidth - 4;
        if (top + tooltip.offsetHeight > window.innerHeight)
          top = window.innerHeight - tooltip.offsetHeight - 4;
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      });
      hDiv.addEventListener('mouseleave', () => (tooltip.style.opacity = 0));

      card.appendChild(hDiv);
    });

    cardsDiv.appendChild(card);
  });
}

// ======================= IBGE: ESTADOS E MUNICÍPIOS =======================
async function carregarEstados() {
  const estadoSelect = document.getElementById('estadoSelect');
  const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
  const estados = await resp.json();
  estados.sort((a, b) => a.nome.localeCompare(b.nome));
  estados.forEach((est) => {
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

  const resp = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`
  );
  const municipios = await resp.json();
  municipios.sort((a, b) => a.nome.localeCompare(b.nome));
  municipios.forEach((mun) => {
    const option = document.createElement('option');
    option.value = mun.nome;
    option.textContent = mun.nome;
    municipioSelect.appendChild(option);
  });

  municipioSelect.disabled = false;
}

// ======================= EVENTOS =======================
document.getElementById('estadoSelect').addEventListener('change', (e) => {
  const estadoId = e.target.value;
  if (estadoId) carregarMunicipios(estadoId);
});

document.getElementById('municipioSelect').addEventListener('change', (e) => {
  const btn = document.getElementById('buscarClimaBtn');
  btn.disabled = !e.target.value;
});

document.getElementById('buscarClimaBtn').addEventListener('click', () => {
  const cidadeEscolhida = document.getElementById('municipioSelect').value;
  if (cidadeEscolhida) {
    city = cidadeEscolhida; // atualiza cidade global
    carregarPrevisao(city);
  }
});

// ======================= INICIALIZA =======================
carregarEstados(); // carrega estados do IBGE
carregarPrevisao(); // carrega previsão da cidade padrão
