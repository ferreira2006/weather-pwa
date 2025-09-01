import { Toast } from "./toasts.js";
import { Theme } from "./theme.js";
import { HistoricoFavoritos } from "./historicoFavoritos.js";
import { IBGE } from "./ibge.js";
import { Cards } from "./cards.js";
import { Geo } from "./geo.js";

// Carrega tema
Theme.load();

// Carrega estados do IBGE
IBGE.carregarEstados();

// Renderiza histórico/favoritos
HistoricoFavoritos.render();

// Inicializa geolocalização
async function inicializarPrevisao(){
  try {
    const resultado = await Geo.detectarLocalizacao();
    if(!resultado) console.log("Fallback: usuário escolhe manualmente.");
  } catch(err){
    console.warn("Erro geolocalização, fallback manual.",err);
  }
}
inicializarPrevisao();

// Eventos fallback
document.getElementById("estado-select").addEventListener("change", async (e)=>{
  const estadoId = e.target.value;
  await IBGE.carregarMunicipios(estadoId);
});

document.getElementById("consultar-btn").addEventListener("click", ()=>{
  const municipioSelect = document.getElementById("municipio-select");
  const estadoSelect = document.getElementById("estado-select");

  if(!municipioSelect.value || !estadoSelect.value){
    Toast.show("Selecione estado e município antes de consultar.");
    return;
  }

  const estadoOption = estadoSelect.options[estadoSelect.selectedIndex];
  const cidadeObj = {
    nome: municipioSelect.value,
    estadoId: estadoSelect.value,
    estadoSigla: estadoOption.dataset.sigla || "",
  };

  Cards.consultarMunicipio(cidadeObj);
});

// Botão voltar ao topo
const scrollTopButton = document.getElementById("back-to-top");
scrollTopButton.style.display = "none";

window.addEventListener("scroll",()=>{
  scrollTopButton.style.display = window.scrollY>200 ? "flex":"none";
});

scrollTopButton.addEventListener("click",()=>{
  window.scrollTo({top:0, behavior:"smooth"});
});

window.testarGeoForcado = async function() {
  try {
    let resultado = null;
    if(navigator.geolocation) {
      try {
        resultado = await Geo.detectarLocalizacao();
      } catch(e) {
        console.warn("Geolocalização real falhou, usando fallback...");
      }
    }

    if(!resultado) {
      resultado = {
        nome: 'São Miguel do Oeste',
        estadoSigla: 'SC',
        id: null
      };
      console.log("Usando fallback forçado:", resultado);
      Cards.consultarMunicipio(resultado);
    }
  } catch(err) {
    console.error("Erro no teste de geolocalização:", err);
  }
};


// Alternar tema
document.getElementById("theme-toggle").addEventListener("click",()=>{ Theme.toggle(); });
