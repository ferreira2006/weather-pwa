// ================== IBGE ==================
export const IBGE = {
  async carregarEstados() {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const now = Date.now();
    if (cached.estados && now - cached.estadosTimestamp < CACHE_VALIDITY) {
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
      frag.appendChild(option);
    });
    select.appendChild(frag);
  },

  async carregarMunicipios(estadoId) {
    // Similar ao código atual para carregar municípios
  },
};
