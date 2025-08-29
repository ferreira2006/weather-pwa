// ================== Configurações ==================
const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";
const CACHE_KEY = "ibge_cache";
const STORAGE_KEY = "previsao_app";
const CACHE_VALIDITY = 7 * 24 * 60 * 60 * 1000; // 1 semana
const maxHistoryItems = 5;
const horariosDesejados = ["00:00:00","06:00:00","12:00:00","18:00:00","21:00:00"];
const horariosNumericos = horariosDesejados.map(h => h.split(":").map(Number));
let lastConsulta = 0; // controle de consultas rápidas

// ================== StorageManager ==================
const StorageManager = {
  cache: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"historico":[],"favoritos":[]}'),
  carregar() { return this.cache; },
  salvar(data) {
    this.cache = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

// ================== Toast ==================
const Toast = (() => {
  let toastEl;
  return {
    show(msg) {
      if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.id = "toast";
        toastEl.className = "toast";
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = msg;
      toastEl.style.opacity = 1;
      setTimeout(() => toastEl.style.opacity = 0, 3000);
    }
  };
})();

// ================== Histórico e Favoritos ==================
const HistoricoFavoritos = {
  adicionarHistorico(municipio, estadoId, estadoSigla) {
    const data = StorageManager.carregar();
    data.historico = data.historico.filter(m => m.nome !== municipio);
    data.historico.unshift({ nome: municipio, estadoId, estadoSigla });
    if (data.historico.length > maxHistoryItems) data.historico.pop();
    StorageManager.salvar(data);
    this.render();
  },

  toggleFavorito(municipioObj) {
    const data = StorageManager.carregar();
    const index = data.favoritos.findIndex(m => m.nome === municipioObj.nome && m.estadoId === municipioObj.estadoId);
    if (index >= 0) data.favoritos.splice(index, 1);
    else {
      if (data.favoritos.length >= 5) return Toast.show("Máximo de 5 favoritos!");
      data.favoritos.push(municipioObj);
    }
    StorageManager.salvar(data);
    this.render();
  },

  criarBotaoMunicipio(m, containerId) {
    const btn = document.createElement("button");
    btn.textContent = `${m.nome} - ${m.estadoSigla}`;
    btn.className = "municipio-btn";
    btn.setAttribute("aria-label", `Selecionar município ${m.nome} - ${m.estadoSigla}`);
    btn.addEventListener("click", () => {
      document.getElementById("estado-select").value = m.estadoId;
      IBGE.carregarMunicipios(m.estadoId).then(() => {
        document.getElementById("municipio-select").value = m.nome;
        Cards.consultarMunicipio({ nome: m.nome, estadoSigla: m.estadoSigla });
      });
    });

    const btnFav = document.createElement("button");
    const storage = StorageManager.carregar();
    const isFav = storage.favoritos.some(f => f.nome === m.nome && f.estadoId === m.estadoId);
    btnFav.textContent = containerId === "historico-container" ? "📌" : "❌";
    btnFav.className = `favorito-btn ${isFav ? "favorito" : "nao-favorito"}`;
    btnFav.setAttribute("aria-label", isFav ? `Remover ${m.nome} dos favoritos` : `Adicionar ${m.nome} aos favoritos`);
    btnFav.addEventListener("click", e => {
      e.stopPropagation();
      HistoricoFavoritos.toggleFavorito(m);
    });

    const div = document.createElement("div");
    div.className = "button-container";
    div.appendChild(btn);
    div.appendChild(btnFav);
    return div;
  },

  render() {
    const data = StorageManager.carregar();

    // Histórico
    const historicoContainer = document.getElementById("historico-container");
    historicoContainer.innerHTML = "";
    const histFrag = document.createDocumentFragment();
    data.historico.forEach(m => histFrag.appendChild(this.criarBotaoMunicipio(m, "historico-container")));
    historicoContainer.appendChild(histFrag);

    // Favoritos
    const favContainer = document.getElementById("favoritos-container");
    favContainer.innerHTML = "";
    const favFrag = document.createDocumentFragment();
    data.favoritos.forEach(m => favFrag.appendChild(this.criarBotaoMunicipio(m, "favoritos-container")));
    favContainer.appendChild(favFrag);
  }
};

// ================== IBGE ==================
const IBGE = {
  async carregarEstados() {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const now = Date.now();
    if (cached.estados && now - cached.estadosTimestamp < CACHE_VALIDITY) {
      this.popularEstados(cached.estados);
      return;
    }
    try {
      const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
      const estados = await res.json();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...cached, estados, estadosTimestamp: now }));
      this.popularEstados(estados);
    } catch (err) {
      Toast.show("Erro ao carregar estados do IBGE");
      console.error(err);
    }
  },

  popularEstados(estados) {
    const select = document.getElementById("estado-select");
    select.innerHTML = '<option value="">Selecione o estado</option>';
    const frag = document.createDocumentFragment();
    estados.forEach(e => {
      const option = document.createElement("option");
      option.value = e.id;
      option.textContent = e.nome;
      option.dataset.sigla = e.sigla;
      frag.appendChild(option);
    });
    select.appendChild(frag);
  },

  async carregarMunicipios(estadoId) {
    const select = document.getElementById("municipio-select");
    select.innerHTML = '<option value="">Selecione o município</option>';
    if (!estadoId) return;

    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const now = Date.now();
    let municipios = [];

    if (cached.municipios && cached.municipios[estadoId] && now - cached.municipios[estadoId].timestamp < CACHE_VALIDITY) {
      municipios = cached.municipios[estadoId].data;
    } else {
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`);
        municipios = await res.json();
        cached.municipios = cached.municipios || {};
        cached.municipios[estadoId] = { data: municipios, timestamp: now };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      } catch (err) {
        Toast.show("Erro ao carregar municípios do IBGE");
        console.error(err);
        return;
      }
    }

    const frag = document.createDocumentFragment();
    municipios.forEach(m => {
      const option = document.createElement("option");
      option.value = m.nome;
      option.textContent = m.nome;
      frag.appendChild(option);
    });
    select.appendChild(frag);
  }
};

// ================== Cards ==================
const Cards = {
  mapIconToClass(main) {
    if (!main) return "clouds";
    main = main.toLowerCase();
    if (main.includes("rain")) return "rain";
    if (main.includes("storm") || main.includes("thunder")) return "storm";
    if (main.includes("cloud")) return "clouds";
    if (main.includes("clear") || main.includes("sun")) return "sun";
    return "clouds";
  },

  mapIconToEmoji(main) {
    if (!main) return "🌤️";
    main = main.toLowerCase();
    if (main.includes("rain")) return "🌧️";
    if (main.includes("storm") || main.includes("thunder")) return "⛈️";
    if (main.includes("cloud")) return "☁️";
    if (main.includes("clear") || main.includes("sun")) return "☀️";
    return "🌤️";
  },

  formatarData(dt_txt) {
    const [ano, mes, dia] = dt_txt.split(" ")[0].split("-");
    const diasSemana = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
    const dateObj = new Date(Number(ano), Number(mes)-1, Number(dia));
    return `${dia}/${mes} ${diasSemana[dateObj.getDay()]}`;
  },

  criarHourDiv(item) {
    const hourDiv = document.createElement("div");
    hourDiv.className = "hour " + this.mapIconToClass(item.weather[0]?.main);
    hourDiv.setAttribute("aria-label", `Hora ${item.dt_txt.split(" ")[1].slice(0,5)}, ${item.weather[0]?.description || ""}, temperatura ${item.main.temp?.toFixed(0) || "--"}°C`);

    const infoDiv = document.createElement("div");
    infoDiv.className = "info";
    infoDiv.textContent = `${item.dt_txt.split(" ")[1].slice(0,5)} ${this.mapIconToEmoji(item.weather[0]?.main)} ${item.weather[0]?.description || ""}`;

    const tempDiv = document.createElement("div");
    tempDiv.className = "temp";
    tempDiv.textContent = `🌡️ ${item.main.temp?.toFixed(0) || "--"}°C`;

    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.innerHTML = `Sensação: ${item.main.feels_like?.toFixed(0) || "--"}°C<br>Umidade: ${item.main.humidity || "--"}%<br>Vento: ${item.wind.speed || "--"} m/s`;

    hourDiv.append(infoDiv, tempDiv, tooltip);
    return hourDiv;
  },

  criarCardDia(dia, lista) {
    const card = document.createElement("div");
    card.className = "card";

    const diaTitle = document.createElement("div");
    diaTitle.className = "day-title";
    diaTitle.textContent = this.formatarData(dia);
    card.appendChild(diaTitle);

    const horasContainer = document.createElement("div");
    horasContainer.className = "hours";

    lista.forEach(item => {
      if (!item || !item.weather || !item.main || !item.wind) return;
      horasContainer.appendChild(this.criarHourDiv(item));
    });

    card.appendChild(horasContainer);
    return card;
  },

  gerarCards(previsao, cidade) {
    const now = Date.now();
    if (now - lastConsulta < 1000) return; // limitar consultas rápidas
    lastConsulta = now;

    const container = document.getElementById("cards-container");
    container.innerHTML = "";
    document.getElementById("title").textContent = `Previsão do tempo para ${cidade.nome} - ${cidade.estadoSigla}`;

    const diasMap = {};
    previsao.list.forEach(item => {
      if (!item.dt_txt) return;
      const [diaStr] = item.dt_txt.split(" ");
      const itemDate = new Date(item.dt_txt);

      const isHorarioDesejado = horariosNumericos.some(([hH, hM, hS]) =>
        itemDate.getHours() === hH && itemDate.getMinutes() === hM && itemDate.getSeconds() === hS
      );
      if (!isHorarioDesejado) return;

      if (!diasMap[diaStr]) diasMap[diaStr] = [];
      diasMap[diaStr].push(item);
    });

    const frag = document.createDocumentFragment();
    Object.entries(diasMap)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(0, 4)
      .forEach(([dia, lista]) => {
        if (lista.length) frag.appendChild(this.criarCardDia(dia, lista));
      });

    container.appendChild(frag);
  },

  mostrarSpinner() { document.getElementById("spinner").style.display = "inline-block"; },
  esconderSpinner() { document.getElementById("spinner").style.display = "none"; },

  async consultarMunicipio(cidadeObj) {
    if (!cidadeObj || !cidadeObj.nome) return;
    this.mostrarSpinner();
    try {
      const res = await fetch(`${backendUrl}?city=${encodeURIComponent(cidadeObj.nome)}`);
      const data = await res.json();
      this.gerarCards(data, cidadeObj);
      HistoricoFavoritos.adicionarHistorico(
        cidadeObj.nome,
        document.getElementById("estado-select").value,
        document.getElementById("estado-select").selectedOptions[0].dataset.sigla
      );
    } catch (err) {
      Toast.show("Erro ao consultar a previsão.");
      console.error(err);
    } finally {
      this.esconderSpinner();
    }
  }
};

// ================== Eventos ==================
document.getElementById("estado-select").addEventListener("change", e => IBGE.carregarMunicipios(e.target.value));
document.getElementById("consultar-btn").addEventListener("click", () => {
  const municipio = document.getElementById("municipio-select").value;
  const sigla = document.getElementById("estado-select").selectedOptions[0].dataset.sigla;
  Cards.consultarMunicipio({ nome: municipio, estadoSigla: sigla });
});

// ================== Tema ==================
const Theme = {
  toggle() {
    const body = document.body;
    const btn = document.getElementById("theme-toggle");
    const isDark = body.classList.contains("dark");

    if (isDark) {
      body.classList.replace("dark", "light");
      localStorage.setItem("theme", "light");
      btn.textContent = "🌙";
    } else {
      body.classList.replace("light", "dark");
      localStorage.setItem("theme", "dark");
      btn.textContent = "☀️";
    }
  },

  load() {
    const saved = localStorage.getItem("theme") || "light";
    document.body.classList.add(saved);
    const btn = document.getElementById("theme-toggle");
    btn.textContent = saved === "dark" ? "☀️" : "🌙";
  }
};

// Eventos
document.getElementById("theme-toggle").addEventListener("click", () => Theme.toggle());

// Inicialização
Theme.load();
IBGE.carregarEstados();
HistoricoFavoritos.render();    lastConsulta = now;

    const container = document.getElementById("cards-container");
    container.innerHTML = "";
    document.getElementById("title").textContent = `Previsão do tempo para ${cidade}`;

    const diasMap = {};
    previsao.list.forEach(item => {
      if (!item.dt_txt) return;
      const [diaStr] = item.dt_txt.split(" ");
      const itemDate = new Date(item.dt_txt);

      const isHorarioDesejado = horariosNumericos.some(([hH, hM, hS]) =>
        itemDate.getHours() === hH && itemDate.getMinutes() === hM && itemDate.getSeconds() === hS
      );
      if (!isHorarioDesejado) return;

      if (!diasMap[diaStr]) diasMap[diaStr] = [];
      diasMap[diaStr].push(item);
    });

    const frag = document.createDocumentFragment();
    Object.entries(diasMap)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(0, 4)
      .forEach(([dia, lista]) => {
        if (lista.length) frag.appendChild(this.criarCardDia(dia, lista));
      });

    container.appendChild(frag);
  },

  mostrarSpinner() { document.getElementById("spinner").style.display = "inline-block"; },
  esconderSpinner() { document.getElementById("spinner").style.display = "none"; },

  async consultarMunicipio(municipio) {
    if (!municipio) return;
    this.mostrarSpinner();
    try {
      const res = await fetch(`${backendUrl}?city=${encodeURIComponent(municipio)}`);
      const data = await res.json();
      this.gerarCards(data, municipio);
      HistoricoFavoritos.adicionarHistorico(municipio, document.getElementById("estado-select").value);
    } catch (err) {
      Toast.show("Erro ao consultar a previsão.");
      console.error(err);
    } finally {
      this.esconderSpinner();
    }
  }
};

// ================== Eventos ==================
document.getElementById("estado-select").addEventListener("change", e => IBGE.carregarMunicipios(e.target.value));
document.getElementById("consultar-btn").addEventListener("click", () => {
  const municipio = document.getElementById("municipio-select").value;
  Cards.consultarMunicipio(municipio);
});

const Theme = {
  toggle() {
    const body = document.body;
    const btn = document.getElementById("theme-toggle");
    const isDark = body.classList.contains("dark");

    if (isDark) {
      body.classList.replace("dark", "light");
      localStorage.setItem("theme", "light");
      btn.textContent = "🌙";
    } else {
      body.classList.replace("light", "dark");
      localStorage.setItem("theme", "dark");
      btn.textContent = "☀️";
    }
  },

  load() {
    const saved = localStorage.getItem("theme") || "light";
    document.body.classList.add(saved);
    const btn = document.getElementById("theme-toggle");
    btn.textContent = saved === "dark" ? "☀️" : "🌙";
  }
};

// Evento
document.getElementById("theme-toggle").addEventListener("click", () => Theme.toggle());

// Inicialização
Theme.load();
IBGE.carregarEstados();
HistoricoFavoritos.render();
