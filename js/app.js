// ======================= CONFIGURAÇÕES =======================
const backendUrlForecast = "https://weather-backend-hh3w.onrender.com/forecast";
const maxHistoryItems = 5;
let city = "São Miguel do Oeste";
const CACHE_TIME = 10 * 60 * 1000; // 10 minutos

// ======================= UTILS =======================
const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  },
  normalizeCityInput(city) {
    return city ? city.replace(/[’‘]/g, "'").trim().replace(/\s+/g, " ") : "";
  },
};

// ======================= DOM ELEMENTS =======================
const dom = {
  themeToggle: document.getElementById("theme-toggle"),
  toast: document.getElementById("toast"),
  cardsDiv: document.getElementById("cards"),
  historyList: document.getElementById("history-list"),
  favoritesList: document.getElementById("favorites-list"),
};

// ======================= STORAGE =======================
const Storage = {
  getHistory: () => JSON.parse(localStorage.getItem("weatherHistory")) || [],
  saveHistory(city) {
    const formattedCity = Utils.capitalizeCityName(city);
    let history = this.getHistory().filter((c) => c !== formattedCity);
    history.unshift(formattedCity);
    localStorage.setItem(
      "weatherHistory",
      JSON.stringify(history.slice(0, maxHistoryItems))
    );
  },

  getFavorites: () => JSON.parse(localStorage.getItem("weatherFavorites")) || [],
  saveFavorites(favs) {
    const formatted = favs.map(Utils.capitalizeCityName);
    localStorage.setItem("weatherFavorites", JSON.stringify(formatted));
  },

  getTheme: () => localStorage.getItem("theme") || "light",
  saveTheme: (theme) => localStorage.setItem("theme", theme),
};

// ======================= UI =======================
const UI = {
  showToast(message, duration = 3000) {
    const t = dom.toast;
    t.textContent = message;
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), duration);
  },

  toggleThemeColors() {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
    Storage.saveTheme(
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  },

  applySavedTheme() {
    const saved = Storage.getTheme();
    document.body.classList.add(saved);
    document.body.classList.remove(saved === "dark" ? "light" : "dark");
  },
};

// ======================= CACHE =======================
function getCached(city) {
  const data = localStorage.getItem(`forecast_${city}`);
  if (!data) return null;
  const parsed = JSON.parse(data);
  if (Date.now() - parsed.timestamp > CACHE_TIME) return null;
  return parsed.data;
}

function setCache(city, data) {
  localStorage.setItem(
    `forecast_${city}`,
    JSON.stringify({ timestamp: Date.now(), data })
  );
}

// ======================= HISTÓRICO E FAVORITOS =======================
const HistoryUI = {
  renderHistory() {
    dom.historyList.innerHTML = "";
    const history = Storage.getHistory();
    history.forEach((cidade) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      const spanCidade = document.createElement("span");
      spanCidade.textContent = cidade;
      spanCidade.style.cursor = "pointer";
      spanCidade.addEventListener("click", () => carregarPrevisao(cidade));
      li.appendChild(spanCidade);

      const btnFav = document.createElement("button");
      btnFav.textContent = "⭐";
      btnFav.title = "Adicionar aos favoritos";
      btnFav.style.marginLeft = "10px";
      btnFav.addEventListener("click", (e) => {
        e.stopPropagation();
        HistoryUI.addToFavorites(cidade);
        UI.showToast(`${cidade} adicionada aos favoritos`);
      });
      li.appendChild(btnFav);

      dom.historyList.appendChild(li);
    });
  },

  renderFavorites() {
    dom.favoritesList.innerHTML = "";
    const favorites = Storage.getFavorites();
    favorites.forEach((cidade) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      const spanCidade = document.createElement("span");
      spanCidade.textContent = cidade;
      spanCidade.style.cursor = "pointer";
      spanCidade.addEventListener("click", () => carregarPrevisao(cidade));
      li.appendChild(spanCidade);

      const btnRemove = document.createElement("button");
      btnRemove.textContent = "❌";
      btnRemove.title = "Remover dos favoritos";
      btnRemove.style.marginLeft = "10px";
      btnRemove.addEventListener("click", (e) => {
        e.stopPropagation();
        HistoryUI.removeFromFavorites(cidade);
        UI.showToast(`${cidade} removida dos favoritos`);
      });
      li.appendChild(btnRemove);

      dom.favoritesList.appendChild(li);
    });
  },

  addToFavorites(cidade) {
    let favs = Storage.getFavorites();
    if (!favs.includes(cidade)) {
      favs.unshift(cidade);
      Storage.saveFavorites(favs.slice(0, maxHistoryItems));
      this.renderFavorites();
    }
  },

  removeFromFavorites(cidade) {
    let favs = Storage.getFavorites().filter((c) => c !== cidade);
    Storage.saveFavorites(favs);
    this.renderFavorites();
  },
};

// ======================= FETCH & PREVISÃO =======================
async function carregarPrevisao(cidade) {
  try {
    let data = getCached(cidade);
    if (!data) {
      const resp = await fetch(`${backendUrlForecast}?city=${encodeURIComponent(cidade)}`);
      if (!resp.ok) throw new Error("Falha ao carregar dados");
      data = await resp.json();
      setCache(cidade, data);
    }

    const dias = agruparPorDia(data);
    const cards = prepararCards(dias);
    renderCards(cards);

  } catch (err) {
    console.error("Erro ao carregar previsão:", err);
    UI.showToast("Erro ao carregar previsão");
  }
}

// ======================= AGRUPAR POR DIA =======================
function agruparPorDia(data) {
  const dias = {};
  data.list.forEach(item => {
    const dt = new Date(item.dt * 1000);
    if (isNaN(dt)) return;

    const dataStr = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    if (!dias[dataStr]) dias[dataStr] = [];

    dias[dataStr].push({
      hora: dt.getHours(),
      temp: Math.round(item.main.temp),
      descricao: item.weather[0].description,
      icon: item.weather[0].icon,
      vento: item.wind.speed,
      umidade: item.main.humidity,
      sensacao: Math.round(item.main.feels_like),
      timestamp: item.dt * 1000
    });
  });

  Object.values(dias).forEach(lista => lista.sort((a, b) => a.hora - b.hora));

  return dias;
}

// ======================= PREPARAR CARDS =======================
function prepararCards(dias) {
  const hoje = new Date();
  const hojeStr = hoje.toLocaleDateString("pt-BR");

  const cards = [];
  Object.keys(dias).sort((a, b) => {
    const da = new Date(a.split("/").reverse().join("-"));
    const db = new Date(b.split("/").reverse().join("-"));
    return da - db;
  }).forEach(dataStr => {
    const lista = dias[dataStr];
    const dataObj = new Date(dataStr.split("/").reverse().join("-"));

    if (dataStr === hojeStr) {
      const agora = hoje.getHours();
      const proximos = lista.filter(h => h.hora >= agora).slice(0, 4);
      if (proximos.length > 0) cards.push({ data: dataStr, dataObj, isHoje: true, horarios: proximos });
    } else {
      const horariosPadraoFuturos = [0, 6, 12, 18];
      const horarios = lista.filter(h => horariosPadraoFuturos.includes(h.hora));
      if (horarios.length > 0) cards.push({ data: dataStr, dataObj, isHoje: false, horarios });
    }
  });

  return cards;
}

// ======================= RENDER CARDS + TOOLTIP =======================
function criarTooltip(texto) {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = texto;
  document.body.appendChild(tooltip);
  return tooltip;
}

function renderCards(cards) {
  const container = dom.cardsDiv;
  container.innerHTML = "";

  cards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";

    const semana = card.dataObj.toLocaleDateString("pt-BR", { weekday: "long" });
    const titulo = card.isHoje ? "Hoje" : `${semana} - ${card.data}`;
    cardEl.innerHTML = `<h3>${titulo}</h3>`;

    const horariosEl = document.createElement("div");
    horariosEl.className = "horarios";

    card.horarios.forEach(h => {
      const horaTexto = (card.isHoje && h.hora < new Date().getHours()) ? `Amanhã ${h.hora}h` : `${h.hora}h`;

      const item = document.createElement("div");
      item.className = "horario";
      item.innerHTML = `
        <p><strong>${horaTexto}</strong></p>
        <img src="https://openweathermap.org/img/wn/${h.icon}.png" alt="${h.descricao}">
        <p>${h.temp}°C</p>
        <p>${h.descricao}</p>
      `;

      const tooltipText = `Vento: ${h.vento} m/s\nUmidade: ${h.umidade}%\nSensação: ${h.sensacao}°C`;
      const tooltip = criarTooltip(tooltipText);

      item.addEventListener("mouseenter", () => {
        tooltip.classList.add("show");
        const rect = item.getBoundingClientRect();
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + "px";
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
      });
      item.addEventListener("mouseleave", () => tooltip.classList.remove("show"));

      horariosEl.appendChild(item);
    });

    cardEl.appendChild(horariosEl);
    container.appendChild(cardEl);
  });
}

// ======================= IBGE =======================
async function carregarEstados() {
  const estadoSelect = document.getElementById("estadoSelect");
  estadoSelect.innerHTML = `<option value="">Carregando estados...</option>`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // timeout 5s

    const resp = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const estados = await resp.json();
    estados.sort((a, b) => a.nome.localeCompare(b.nome));

    estadoSelect.innerHTML = `<option value="">Selecione um estado</option>`;
    estados.forEach(est => {
      const option = document.createElement("option");
      option.value = est.id;
      option.textContent = est.nome;
      estadoSelect.appendChild(option);
    });
    estadoSelect.disabled = false;

  } catch (err) {
    console.error("Erro ao carregar estados IBGE:", err);
    estadoSelect.innerHTML = `<option value="">Não foi possível carregar estados</option>`;
    estadoSelect.disabled = true;
  }
}


async function carregarMunicipios(estadoId) {
  const municipioSelect = document.getElementById("municipioSelect");
  municipioSelect.innerHTML = `<option value="">Selecione um município</option>`;
  municipioSelect.disabled = true;

  const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`);
  const municipios = await resp.json();
  municipios.sort((a, b) => a.nome.localeCompare(b.nome));
  municipios.forEach(mun => {
    const option = document.createElement("option");
    option.value = mun.nome;
    option.textContent = mun.nome;
    municipioSelect.appendChild(option);
  });
  municipioSelect.disabled = false;
}

// ======================= INICIALIZAÇÃO =======================
const App = {
  init() {
    UI.applySavedTheme();

    const estadoSelect = document.getElementById("estadoSelect");
    const municipioSelect = document.getElementById("municipioSelect");
    const buscarBtn = document.getElementById("buscarClimaBtn");

    carregarEstados();

    estadoSelect.addEventListener("change", (e) => {
      if (e.target.value) carregarMunicipios(e.target.value);
    });

    municipioSelect.addEventListener("change", (e) => {
      buscarBtn.disabled = !e.target.value;
    });

    buscarBtn.addEventListener("click", () => {
      const cidadeEscolhida = municipioSelect.value;
      if (cidadeEscolhida) {
        carregarPrevisao(cidadeEscolhida);
        Storage.saveHistory(cidadeEscolhida);
        HistoryUI.renderHistory();
      }
    });

    const lastCity = Storage.getHistory()[0] || city;
    carregarPrevisao(lastCity);

    HistoryUI.renderHistory();
    HistoryUI.renderFavorites();

    dom.themeToggle.addEventListener("click", () => UI.toggleThemeColors());
  },
};

window.onload = () => App.init();
