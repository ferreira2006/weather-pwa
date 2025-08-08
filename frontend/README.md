# Weather PWA

Weather PWA é um Progressive Web App simples para exibir a previsão do tempo baseada na localização do usuário.  
O projeto utiliza geolocalização para obter latitude e longitude, e consome uma API de clima para mostrar dados atualizados.

---

## Funcionalidades

- Obtenção automática da localização via geolocalização do navegador  
- Busca da previsão do tempo usando API externa OpenWeatherMap
- Interface responsiva e simples para celulares e desktops  
- Funciona offline usando Service Worker (cache básico)  
- Pode ser instalado como app no celular via navegador

---

## Estrutura do Projeto

- `index.html` — página principal  
- `styles.css` — estilos da aplicação  
- `app.js` — lógica frontend  
- `manifest.json` — configurações do PWA  
- `service-worker.js` — cache e funcionalidade offline  
- `backend/` — código do backend simples em Node.js (Express) que faz proxy para a API de clima

---

