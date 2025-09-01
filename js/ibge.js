import { CACHE_KEY, CACHE_VALIDITY } from './config.js';
import { Toast } from './toasts.js';

const IBGE = {
  async carregarEstados() {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const agora = Date.now();

    if (cache.estados && cache.timestamp && (agora - cache.timestamp < CACHE_VALIDITY)) {
      this.renderEstados(cache.estados);
      return;
    }

    try {
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
      if (!res.ok) throw new Error('Erro ao buscar estados do IBGE');
      const data = await res.json();

      const estados = data.map(e => ({
        id: e.id,
        sigla: e.sigla,
        nome: e.nome,
        municipios: []
      }));

      localStorage.setItem(CACHE_KEY, JSON.stringify({ estados, timestamp: agora }));
      this.renderEstados(estados);

    } catch (err) {
      console.error(err);
      Toast.show('Não foi possível carregar os estados.');
    }
  },

  renderEstados(estados) {
    const select = document.getElementById('estado-select');
    select.innerHTML = `<option value="">Selecione um estado</option>`;
    estados.sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.nome;
      opt.dataset.sigla = e.sigla;
      select.appendChild(opt);
    });
  },

  async carregarMunicipios(estadoId) {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const estados = cache.estados || [];
    const estado = estados.find(e => e.id == estadoId);
    if (!estado) return;

    if (!estado.municipios || estado.municipios.length === 0) {
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`);
        if(!res.ok) throw new Error('Erro ao buscar municípios');
        const data = await res.json();
        estado.municipios = data.map(m=>({id:m.id, nome:m.nome}));
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch(err) {
        console.error(err);
        Toast.show('Não foi possível carregar os municípios.');
        return;
      }
    }

    this.renderMunicipios(estado.municipios);
  },

  renderMunicipios(municipios) {
    const select = document.getElementById('municipio-select');
    select.innerHTML = `<option value="">Selecione um município</option>`;
    municipios.sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(m=>{
      const opt = document.createElement('option');
      opt.value = m.nome;
      opt.textContent = m.nome;
      select.appendChild(opt);
    });
  }
};

export { IBGE };
