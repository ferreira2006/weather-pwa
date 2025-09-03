# 🌤 Clima Novo

Clima Novo é um aplicativo de previsão do tempo moderno e leve, que permite consultar o clima de qualquer cidade do Brasil com facilidade.  
Inclui histórico, favoritos, cards interativos e suporte a tema claro/escuro.

https://ferreira2006.github.io/weather-pwa/
---

## ✨ Funcionalidades

- 🌡 **Previsão do tempo**  
  Temperatura, sensação térmica, vento e umidade para horários importantes: `00:00`, `06:00`, `12:00`, `18:00`, `21:00`.

- 🌍 **Seleção de Estado e Município**  
  Integração com a API do [IBGE](https://servicodados.ibge.gov.br) para carregar estados e municípios dinamicamente.

- 🕑 **Histórico de consultas**  
  Últimos municípios consultados armazenados para fácil acesso.

- 📌 **Favoritos**  
  Adicione até 5 cidades favoritas com feedback visual e notificações (toasts).

- 🌗 **Tema claro/escuro**  
  Alternância entre temas com persistência da preferência no navegador.

- ⬆️ **Botão voltar ao topo**  
  Facilita a navegação quando há muitos cards exibidos.

- 🔔 **Toasts interativos**  
  Notificações visuais para ações e erros.

---

## 🛠 Tecnologias

- **JavaScript (ES6 Modules)**  
- **HTML5 & CSS3**  
- **LocalStorage** para histórico, favoritos e tema  
- **Fetch API** para backend de previsão do tempo e IBGE

---

## 📁 Estrutura do Projeto
```
/assets → ícones e imagens
/css → estilos e temas
/js → módulos do app (cards, IBGE, histórico, storage, theme, toasts)
index.html → página principal

```


---

## 🚀 Como Usar

1. Abrir `index.html` no navegador  
2. Selecionar um **estado**  
3. Aguardar carregamento dos municípios  
4. Escolher um **município** e clicar em **Consultar**  
5. Visualizar a previsão nos **cards interativos**  
6. Adicionar cidades aos **favoritos** com o ícone 📌 ou ❌  
7. Alternar **tema claro/escuro** com o botão no canto superior  

---

## 📝 Próximas Funcionalidades

- 📊 Gráficos de tendência do clima  
- 🔍 Filtros avançados por condições climáticas  
- 📤 Exportação ou compartilhamento de previsões  

---

## 🛡 Compatibilidade

Testado nos principais navegadores modernos: Chrome, Edge, Firefox e Safari.

---

## 📄 Licença

MIT License © 2025
