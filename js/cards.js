// ================== Cards ==================
import { Toast } from './toast.js';

export const Cards = {
  gerarCards(previsao, cidadeObj) {
    // Similar ao código atual para gerar os cards de previsão
  },

  mostrarSpinner() {
    const btn = document.getElementById('consultar-btn');
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'inline-block';
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
  },

  esconderSpinner() {
    const btn = document.getElementById('consultar-btn');
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'none';
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
  },

  async consultarMunicipio(cidadeObj) {
    // Similar ao código atual para consultar a previsão
  },
};
