import { backendUrl, getLastConsulta, setLastConsulta, horariosNumericos } from './config.js';
import { Toast } from './toasts.js';
import { HistoricoFavoritos } from './historicoFavoritos.js';

const Cards = {
  // ================== Mapas de ícone ==================
  mapIconToClass(main) {
    main = main?.toLowerCase() || '';
    if (main.includes('rain')) return 'rain';
    if (main.includes('storm') || main.includes('thunder')) return 'storm';
    if (main.includes('cloud')) return 'clouds';
    if (main.includes('clear') || main.includes('sun')) return 'sun';
    return 'clouds';
  },

  mapIconToEmoji(main) {
    main = main?.toLowerCase() || '';
    if (main.includes('rain')) return '🌧️';
    if (main.includes('storm') || main.includes('thunder')) return '⛈️';
    if (main.includes('cloud')) return '☁️';
    if (main.includes('clear') || main.includes('sun')) return '☀️';
    return '🌤️';
  },

  // ================== Formatação de data ==================
  formatarData(dt_txt) {
    if (!dt_txt) return '';
    const [ano, mes, dia] = dt_txt.split(' ')[0].split('-');
    const diasSemana = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
    const dateObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return `${dia}/${mes} ${diasSemana[dateObj.getDay()]}`;
  },

  // ================== Criar elementos ==================
  criarHourDiv(item) {
    if (!item?.weather?.[0] || !item.main || !item.wind) return null;

    const hourDiv = document.createElement('div');
    hourDiv.className = 'hour ' + this.mapIconToClass(item.weather[0]?.main);
    hourDiv.setAttribute(
      'aria-label',
      `Hora ${item.dt_txt?.split(' ')[1]?.slice(0, 5)}, ${item.weather[0]?.description || ''}, temperatura ${item.main.temp?.toFixed(0) ?? '--'}°C`
    );

    const infoDiv = document.createElement('div');
    infoDiv.className = 'info';
    infoDiv.textContent = `${item.dt_txt?.split(' ')[1]?.slice(0, 5)} ${this.mapIconToEmoji(item.weather[0]?.main)} ${item.weather[0]?.description || ''}`;

    const tempDiv = document.createElement('div');
    tempDiv.className = 'temp';
    tempDiv.textContent = `🌡️ ${item.main.temp?.toFixed(0) ?? '--'}°C`;

    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.innerHTML = `Sensação: ${item.main.feels_like?.toFixed(0) ?? '--'}°C<br>Umidade: ${item.main.humidity ?? '--'}%<br>Vento: ${item.wind.speed ?? '--'} m/s`;

    hourDiv.append(infoDiv, tempDiv, tooltip);
    return hourDiv;
  },

  criarCardDia(dia, lista) {
    const card = document.createElement('div');
    card.className = 'card';

    const diaTitle = document.createElement('div');
    diaTitle.className = 'day-title';
    diaTitle.textContent = this.formatarData(dia);
    card.appendChild(diaTitle);

    const horasContainer = document.createElement('div');
    horasContainer.className = 'hours';

    lista.forEach(item => {
      const hourDiv = this.criarHourDiv(item);
      if (hourDiv) horasContainer.appendChild(hourDiv);
    });

    card.appendChild(horasContainer);
    return card;
  },

  // ================== Gerar cards ==================
  gerarCards(previsao, cidadeObj) {
    if (!previsao?.list?.length) {
      Toast.show('Previsão indisponível no momento.');
      return;
    }

    const now = Date.now();
    if (now - getLastConsulta() < 1000) return;
    setLastConsulta(now);

    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    document.getElementById('title').textContent = `Previsão do tempo para ${cidadeObj.nome} - ${cidadeObj.estadoSigla ?? ''}`;

    const diasMap = {};
    previsao.list.forEach(item => {
      const diaStr = item.dt_txt?.split(' ')[0];
      const itemDate = new Date(item.dt_txt);
      if (!diaStr || !itemDate) return;

      const isHorarioDesejado = Array.isArray(horariosNumericos) && horariosNumericos.some(
        ([hH, hM, hS]) => itemDate.getHours() === hH && itemDate.getMinutes() === hM && itemDate.getSeconds() === hS
      );
      if (!isHorarioDesejado) return;

      diasMap[diaStr] = diasMap[diaStr] ?? [];
      diasMap[diaStr].push(item);
    });

    if (!Object.keys(diasMap).length) {
      Toast.show('Horários desejados não disponíveis para esta cidade.');
      return;
    }

    Object.values(diasMap).forEach(lista => lista.sort((a, b) => new Date(a.dt_txt) - new Date(b.dt_txt)));

    const frag = document.createDocumentFragment();
    Object.entries(diasMap)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(0, 4)
      .forEach(([dia, lista]) => frag.appendChild(this.criarCardDia(dia, lista)));

    container.appendChild(frag);

    // Foco e scroll
    const titleEl = document.getElementById('title');
    if (titleEl) {
      titleEl.setAttribute('tabindex', '-1');
      titleEl.focus({ preventScroll: true });
      titleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // ================== Spinner ==================
  mostrarSpinner() {
    this._setBotaoConsulta(true);
  },

  esconderSpinner() {
    this._setBotaoConsulta(false);
  },

  _setBotaoConsulta(state) {
    const btn = document.getElementById('consultar-btn');
    const spinner = document.getElementById('spinner');
    spinner.style.display = state ? 'inline-block' : 'none';
    btn.disabled = state;
    if (state) btn.setAttribute('aria-busy', 'true');
    else btn.removeAttribute('aria-busy');
  },

  // ================== Consultar ==================
  async consultarMunicipio(cidadeObj) {
    if (!cidadeObj?.nome) {
      Toast.show('Selecione uma cidade antes de consultar.');
      return;
    }

    this.mostrarSpinner();

    try {
      const res = await fetch(`${backendUrl}?city=${encodeURIComponent(cidadeObj.nome)}`);
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const data = await res.json();

      if (!data?.list?.length) {
        Toast.show('Previsão não encontrada para esta cidade.');
        return;
      }

      this.gerarCards(data, cidadeObj);
      HistoricoFavoritos.adicionarHistorico(cidadeObj);
    } catch (err) {
      console.error(err);
      Toast.show('Erro ao consultar a previsão. Tente novamente mais tarde.');
    } finally {
      this.esconderSpinner();
    }
  },
};

export { Cards };
