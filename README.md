# Weather App PWA

Aplicação web progressiva para consulta de clima por cidade, com temas claro/escuro, histórico e favoritos.

---

## Funcionalidades

- Consulta do clima atual por nome da cidade ou geolocalização.
- Exibição de dados principais: temperatura, sensação térmica, umidade, vento, descrição e ícone animado.
- Tema claro e escuro com persistência da preferência.
- Histórico das últimas 5 cidades buscadas.
- Lista de cidades favoritas com possibilidade de adicionar/remover.
- Background dinâmico com gradientes animados conforme o clima e tema.
- Feedback visual via toasts.
- Totalmente acessível com foco visível, navegação via teclado e labels adequados.
- Responsivo para dispositivos móveis e desktop.
- Spinner de carregamento durante consultas.

---

## Tecnologias

- HTML5 semântico
- CSS3 com variáveis customizadas e animações
- JavaScript moderno (ES6+), módulos e Promises
- API externa para dados meteorológicos
- LocalStorage para persistência local
- Progressive Web App (PWA) pronta para instalação (opcional)

---

## Como usar

1. Clone este repositório:
   ```bash
   git clone https://github.com/ferreira2006/weather-app-pwa.git

2. Abra o arquivo index.html em um navegador moderno.

3. Digite o nome da cidade no campo de busca e clique em "Buscar" ou pressione Enter.

4. Para adicionar a cidade atual aos favoritos, clique no botão "Adicionar Favorito".

5. Use o botão "Modo Escuro"/"Modo Claro" para alternar o tema visual.

6. Visualize o histórico e favoritos nas seções abaixo do clima.

Permita acesso à geolocalização para buscar o clima da sua localização atual.

## Estrutura de arquivos

```plaintext
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── icons/
│   ├── wi-day-sunny.svg
│   ├── wi-cloudy.svg
│   ├── wi-rain.svg
│   ├── wi-thunderstorm.svg
│   └── wi-snow.svg
└── README.md
```

## Diagrama de Estrutura do App de Clima

```plaintext
BODY [class="light" ou "dark"]
│
├─ HEADER
│   ├─ <h1>Clima Atual</h1>
│   └─ BUTTON [id="theme-toggle"] → JS: alterna tema, CSS: cores/light-dark
│
├─ MAIN
│   ├─ SEARCH SECTION [id="search-section"]
│   │   └─ FORM [id="search-box"]
│   │       ├─ INPUT [id="city-input"] → JS: digitação e validação
│   │       ├─ DATALIST [id="city-suggestions"] → autocomplete (opcional)
│   │       ├─ BUTTON [id="search-btn"] → JS: busca clima
│   │       └─ BUTTON [id="fav-btn"] → JS: adiciona cidade aos favoritos
│   │
│   ├─ FAVORITES SECTION [id="favorites-section"]
│   │   ├─ <h2>Cidades Favoritas</h2>
│   │   └─ UL [id="favorites-list"] → JS renderiza li de cidades favoritas
│   │
│   ├─ WEATHER SECTION [id="weather"] → JS: mostra clima ou erro
│   │   ├─ DIV [id="icon" class="weather-icon"] → CSS: iconografia e cores dinâmicas
│   │   ├─ DIV [id="weather-content"]
│   │   │   ├─ H2 [id="city-name"]
│   │   │   ├─ DIV [id="temp"]
│   │   │   ├─ DIV [id="desc"]
│   │   │   └─ DIV [id="details"]
│   │   ├─ DIV [id="weather-error"] → JS: mostra erros
│   │   └─ DIV [id="spinner"] → CSS + JS: carregamento
│   │
│   └─ HISTORY SECTION [id="history-section"]
│       ├─ <h2>Últimas cidades pesquisadas</h2>
│       └─ UL [id="history-list"] → JS renderiza histórico
│
├─ TOAST [id="toast"] → JS: mensagens temporárias
│
└─ MODAL DE CONFIRMAÇÃO [id="confirm-modal"] → JS: remover favoritos
    ├─ DIV [class="modal-overlay"] → CSS: fundo semi-transparente
    └─ DIV [class="modal-content"]
        ├─ H2 [id="confirm-modal-title"]
        ├─ P [id="confirm-modal-desc"]
        └─ DIV [class="modal-buttons"]
            ├─ BUTTON [id="confirm-yes"]
            └─ BUTTON [id="confirm-no"]

```

## Conexões JS ↔ HTML ↔ CSS

```plaintext
| Elemento          | JS                                 | CSS                     |
| ----------------- | ---------------------------------- | ----------------------- |
| `#city-input`     | input, validação, focus            | cores de fundo/texto    |
| `#search-btn`     | busca cidade                       | cores, disabled state   |
| `#fav-btn`        | adiciona/remover favoritos         | cores, disabled state   |
| `#weather`        | exibe clima ou erro                | animações de fade, grid |
| `.weather-icon`   | atualiza classe do ícone           | cores e ícones          |
| `#toast`          | exibe mensagens temporárias        | fade in/out             |
| `#favorites-list` | renderiza favoritos                | cores, hover, cursor    |
| `#history-list`   | renderiza histórico                | cores, hover, cursor    |
| `#theme-toggle`   | alterna `light`/`dark`             | cores globais do root   |
| `#spinner`        | mostra/oculta durante carregamento | animação spinner        |
| `#confirm-modal`  | confirma remoção de favorito       | overlay e modal visível |

```


## Contribuição

Contribuições são bem-vindas! Para sugerir melhorias ou correções:

Faça um fork deste repositório.

Crie uma branch com a sua feature (git checkout -b minha-feature).

Faça commits das suas alterações (git commit -m 'Minha feature').

Faça push para sua branch (git push origin minha-feature).

Abra um Pull Request.

## Licença
Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Contato
Se precisar de ajuda, abra uma issue ou entre em contato via email: seu-email@exemplo.com


Feito com ❤️ para facilitar sua consulta do clima!
