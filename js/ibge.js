// ================== IBGE ==================

import { CACHE_KEY, CACHE_VALIDITY } from './config.js';
import { Toast } from './toasts.js';

const IBGE = {
  async carregarEstados() {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const now = Date.now();

    if (cached.estados?.length && now - cached.estadosTimestamp < CACHE_VALIDITY) {
      this.popularEstados(cached.estados);
      return;
    }

    try {
      const res = await fetch(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
      );
      const estados = await res.json();
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ...cached, estados, estadosTimestamp: now })
      );
      this.popularEstados(estados);
    } catch (err) {
      Toast.show('Erro ao carregar estados do IBGE');
      console.error(err);
    }
  },

  popularEstados(estados) {
    const select = document.getElementById('estado-select');
    select.innerHTML = '<option value="">Selecione o estado</option>';
    const frag = document.createDocumentFragment();
    estados.forEach((e) => {
      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.nome;
      option.dataset.sigla = e.sigla;
      frag.appendChild(option);
    });
    select.appendChild(frag);
  },

  async carregarMunicipios(estadoId) {
    const select = document.getElementById('municipio-select');
    select.innerHTML = '<option value="">Selecione o município</option>';
    if (!estadoId) return;

    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const now = Date.now();
    let municipios = [];

    if (cached.municipios?.[estadoId]?.timestamp && now - cached.municipios[estadoId].timestamp < CACHE_VALIDITY) {
      municipios = cached.municipios[estadoId].data;
    } else {
      try {
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`
        );
        municipios = await res.json();
        cached.municipios = cached.municipios || {};
        cached.municipios[estadoId] = { data: municipios, timestamp: now };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      } catch (err) {
        Toast.show('Erro ao carregar municípios do IBGE');
        console.error(err);
        return;
      }
    }

    const frag = document.createDocumentFragment();
    municipios.forEach((m) => {
      const option = document.createElement('option');
      option.value = m.nome;
      option.textContent = m.nome;
      frag.appendChild(option);
    });
    select.appendChild(frag);
  },
};

export { IBGE };
