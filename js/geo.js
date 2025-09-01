import { Cards } from './cards.js';
import { CACHE_KEY } from './config.js';

const Geo = {
  async detectarLocalizacao() {
    if(!navigator.geolocation){
      console.log("Geolocalização não suportada pelo navegador.");
      return false;
    }

    return new Promise((resolve,reject)=>{
      navigator.geolocation.getCurrentPosition(async (pos)=>{
        const {latitude, longitude} = pos.coords;
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await resp.json();
          const cidade = data.address.city || data.address.town || data.address.village;
          const estadoSigla = data.address.state_code;

          if(!cidade || !estadoSigla) return reject("Não foi possível detectar a cidade.");

          const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
          const estados = cache.estados || [];
          const estadoObj = estados.find(e => e.sigla === estadoSigla);
          if(!estadoObj) return Geo.usarFallback(cidade,estadoSigla,resolve);

          const cidadeObj = estadoObj.municipios.find(m => m.nome.toLowerCase()===cidade.toLowerCase());
          if(!cidadeObj) return Geo.usarFallback(cidade,estadoSigla,resolve);

          const resultado = { nome:cidadeObj.nome, estadoId:estadoObj.id, estadoSigla, id:cidadeObj.id };
          console.log("Cidade detectada via geolocalização (IBGE):", resultado);
          Cards.consultarMunicipio(resultado);
          resolve(resultado);
        } catch(err){
          reject(err);
        }
      },(err)=>{
        console.warn("Erro ao obter localização:",err);
        reject(err);
      });
    });
  },

  usarFallback(cidade, estadoSigla, resolve){
    const usar = confirm(`Não encontrei ${cidade}/${estadoSigla} no cache IBGE.\n\nQuer usar mesmo assim?`);
    if(usar){
      const resultado = { nome:cidade, estadoSigla, id:null };
      console.log("Usando fallback (sem ID IBGE):", resultado);
      Cards.consultarMunicipio(resultado);
      resolve(resultado);
    } else {
      console.log("Usuário recusou usar fallback.");
      resolve(false);
    }
  }
};

export { Geo };
