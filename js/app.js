const backendUrl = "https://weather-backend-hh3w.onrender.com/forecast";

      // --- Cache para estados e municípios ---
      const CACHE_KEY = "ibge_cache";
      const CACHE_VALIDITY = 7 * 24 * 60 * 60 * 1000; // 1 semana

      async function carregarEstados() {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
        const now = Date.now();
        if (cached.estados && now - cached.timestamp < CACHE_VALIDITY) {
          console.log("Usando cache de estados");
          popularEstados(cached.estados);
          return;
        }
        const res = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
        );
        const estados = await res.json();
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ estados, timestamp: now })
        );
        popularEstados(estados);
      }

      function popularEstados(estados) {
        const select = document.getElementById("estado-select");
        select.innerHTML = '<option value="">Selecione o estado</option>';
        estados.forEach((e) => {
          const option = document.createElement("option");
          option.value = e.id;
          option.textContent = e.nome;
          select.appendChild(option);
        });
      }

      async function carregarMunicipios(estadoId) {
        if (!estadoId) return;
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
        const now = Date.now();
        let municipios = [];
        if (
          cached.municipios &&
          cached.municipios[estadoId] &&
          now - cached.timestamp < CACHE_VALIDITY
        ) {
          console.log("Usando cache de municípios");
          municipios = cached.municipios[estadoId];
        } else {
          const res = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`
          );
          municipios = await res.json();
          cached.municipios = cached.municipios || {};
          cached.municipios[estadoId] = municipios;
          cached.timestamp = now;
          localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        }

        const select = document.getElementById("municipio-select");
        select.innerHTML = '<option value="">Selecione o município</option>';
        municipios.forEach((m) => {
          const option = document.createElement("option");
          option.value = m.nome;
          option.textContent = m.nome;
          select.appendChild(option);
        });
      }

      // --- Utilitários ---
      function mapIconToClass(main) {
        main = main.toLowerCase();
        if (main.includes("rain")) return "rain";
        if (main.includes("storm") || main.includes("thunder")) return "storm";
        if (main.includes("cloud")) return "clouds";
        if (main.includes("clear") || main.includes("sun")) return "sun";
        return "clouds";
      }

      function mapIconToEmoji(main) {
        main = main.toLowerCase();
        if (main.includes("rain")) return "🌧️";
        if (main.includes("storm") || main.includes("thunder")) return "⛈️";
        if (main.includes("cloud")) return "☁️";
        if (main.includes("clear") || main.includes("sun")) return "☀️";
        return "🌤️";
      }

      function formatarData(dia) {
        const dateObj = new Date(dia);
        const diasSemana = [
          "domingo",
          "segunda-feira",
          "terça-feira",
          "quarta-feira",
          "quinta-feira",
          "sexta-feira",
          "sábado",
        ];
        const diaSemana = diasSemana[dateObj.getDay()];
        const diaNum = String(dateObj.getDate()).padStart(2, "0");
        const mes = String(dateObj.getMonth() + 1).padStart(2, "0");
        return `${diaNum}/${mes} ${diaSemana}`;
      }

      function agruparPorDia(lista) {
        if (!lista) return {};
        const dias = {};
        lista.forEach((item) => {
          const dia = item.dt_txt.split(" ")[0];
          if (!dias[dia]) dias[dia] = [];
          dias[dia].push(item);
        });
        return dias;
      }

      // --- Cards ---
      function gerarCards(previsao, cidade) {
        if (!previsao || !previsao.list) {
          alert("Previsão inválida");
          return;
        }

        const container = document.getElementById("cards-container");
        container.innerHTML = "";
        document.getElementById(
          "title"
        ).textContent = `Previsão do tempo para ${cidade}`;

        const dias = Object.entries(agruparPorDia(previsao.list));
        const diasParaMostrar = dias.slice(0, 4); // hoje + 3 dias

        const now = new Date();
        const hojeStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

        diasParaMostrar.forEach(([dia, horarios], index) => {
          const card = document.createElement("div");
          card.className = "card";

          const diaTitle = document.createElement("div");
          diaTitle.className = "day-title";
          diaTitle.textContent = formatarData(dia);
          card.appendChild(diaTitle);

          const horasContainer = document.createElement("div");
          horasContainer.className = "hours";

          let horariosParaMostrar = [];

          if (index === 0) {
            // Card do dia atual → próximos 5 horários, pegando do próximo dia se necessário
            const futuros = previsao.list.filter(
              (h) => new Date(h.dt_txt) >= now
            );
            horariosParaMostrar = futuros.slice(0, 5).map((h) => ({
              ...h,
              flag: h.dt_txt.split(" ")[0] !== hojeStr ? "amanhã" : "",
            }));
          } else {
            // Outros dias → horários fixos
            const horariosDesejados = [
              "00:00:00",
              "06:00:00",
              "12:00:00",
              "18:00:00",
              "21:00:00",
            ];
            horariosDesejados.forEach((horaStr) => {
              const item = horarios.find((h) => h.dt_txt.includes(horaStr));
              if (item) horariosParaMostrar.push(item);
            });
          }

          horariosParaMostrar.forEach((item) => {
            const hourDiv = document.createElement("div");
            hourDiv.classList.add("hour", mapIconToClass(item.weather[0].main));

            const emoji = mapIconToEmoji(item.weather[0].main);
            const horaTxt = item.dt_txt.split(" ")[1].slice(0, 2) + "h";

            hourDiv.innerHTML = `
    <div class="info">
      <span class="hora">${horaTxt}</span> ${emoji} ${
              item.weather[0].description
            }
      ${item.flag ? `<span class="flag">(${item.flag})</span>` : ""}
    </div>
    <div class="temp">${item.main.temp.toFixed(0)}°C</div>
    <span class="tooltip">
      Sensação: ${item.main.feels_like.toFixed(0)}°C<br>
      Umidade: ${item.main.humidity}%<br>
      Vento: ${item.wind.speed} m/s
    </span>
  `;

            horasContainer.appendChild(hourDiv);
          });

          card.appendChild(horasContainer);
          container.appendChild(card);
        });
      }

      // --- Eventos ---
      document
        .getElementById("estado-select")
        .addEventListener("change", (e) => {
          carregarMunicipios(e.target.value);
        });

      document
        .getElementById("consultar-btn")
        .addEventListener("click", async () => {
          const cidade = document.getElementById("municipio-select").value;
          if (!cidade) return alert("Selecione um município!");

          const spinner = document.getElementById("spinner");
          spinner.style.display = "block";

          try {
            const res = await fetch(
              `${backendUrl}?city=${encodeURIComponent(cidade)}`
            );
            const data = await res.json();

            console.log("Resposta do backend:", data); // 🔍 inspeciona o JSON

            if (!data || !data.list) throw new Error("Previsão inválida");

            gerarCards(data, cidade);
          } catch (e) {
            alert("Erro ao buscar previsão.");
            console.error(e);
          } finally {
            spinner.style.display = "none";
          }
        });

      // --- Inicialização ---
      carregarEstados();