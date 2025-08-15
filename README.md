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

```text
weather-pwa/
│
├── index.html              # Página principal
├── manifest.json           # Manifesto PWA
├── service-worker.js       # Service Worker para cache/offline
│
├── assets/                 # Imagens, ícones, fontes
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── favicon.ico
│   └── images/
│       └── background.jpg
│
├── css/                    # Arquivos de estilo
│   └── styles.css
│
├── js/                     # Lógica JS
│   ├── app.js              # Lógica principal do clima
│   └── ui.js               # Funções de interface
│
└── vendor/                 # Bibliotecas externas (opcional)
    └── some-lib.js
```
---

## Fluxo de Interações (JS ↔ HTML ↔ CSS)

```text
1. Tema (light/dark)
   #theme-toggle.click
   └─ Alterna body.light <-> body.dark
        └─ Atualiza localStorage ("theme")
        └─ CSS aplica cores, gradientes, inputs e botões

2. Busca de cidade
   #city-input.change → habilita #search-btn
   #search-btn.click
   └─ Bloqueia botões, mostra #spinner
   └─ Fetch API clima
        ├─ Success → atualiza #weather-content e #icon
        └─ Error → mostra #weather-error
   └─ Atualiza histórico #history-list e localStorage
   └─ Remove loading (#spinner e placeholders)

3. Favoritar cidade
   #fav-btn.click
   ├─ Se não favorita → adiciona em #favorites-list + localStorage
   └─ Se já favorita → abre #confirm-modal
         ├─ #confirm-yes → remove favorito
         └─ #confirm-no → fecha modal

4. Toast notifications
   showToast(message)
   └─ #toast.show + animação fade in/out

```
---

## Conexões JS ↔ HTML ↔ CSS

```text
| Elemento          | JS                                 | CSS                     |
| ----------------- | ---------------------------------- | ----------------------- |
| #city-input       | input, validação, focus            | cores de fundo/texto    |
| #search-btn       | busca cidade                       | cores, disabled state   |
| #fav-btn          | adiciona/remover favoritos         | cores, disabled state   |
| #weather          | exibe clima ou erro                | animações de fade, grid |
| .weather-icon     | atualiza classe do ícone           | cores e ícones          |
| #toast            | exibe mensagens temporárias        | fade in/out             |
| #favorites-list   | renderiza favoritos                | cores, hover, cursor    |
| #history-list     | renderiza histórico                | cores, hover, cursor    |
| #theme-toggle     | alterna light/dark                 | cores globais do root   |
| #spinner          | mostra/oculta durante carregamento | animação spinner        |
| #confirm-modal    | confirma remoção de favorito       | overlay e modal visível |

```
---

## Contribuição

Contribuições são bem-vindas!
. Faça um fork deste repositório.
. Crie uma branch com a sua feature: git checkout -b minha-feature.
. Faça commits das alterações: git commit -m 'Minha feature'.
. Faça push para sua branch: git push origin minha-feature.
. Abra um Pull Request.

---

## Licença
Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

---

## Contato
Para dúvidas ou sugestões, abra uma issue ou entre em contato via email: ferreira2006@gmail.com
Feito com ❤️ para facilitar sua consulta do clima!
