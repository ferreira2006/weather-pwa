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
