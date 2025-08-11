// ... seu código anterior (consts e funções) ...

// --- FAVORITOS ---
// Retorna array de favoritos
function getFavorites() {
  return JSON.parse(localStorage.getItem("weatherFavorites")) || [];
}

function saveFavorites(favorites) {
  localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
}

function isFavorite(city) {
  const favorites = getFavorites();
  return favorites.some((c) => c.toLowerCase() === city.toLowerCase());
}

function addFavorite(city) {
  let favorites = getFavorites();
  if (isFavorite(city)) {
    showToast(`"${city}" já está nos favoritos.`);
    return;
  }
  favorites.push(city);
  saveFavorites(favorites);
  renderFavorites();
  showToast(`"${city}" adicionado aos favoritos!`);
  updateFavBtnState();  // Atualiza estado do botão após adicionar
}

function removeFavorite(city) {
  let favorites = getFavorites();
  favorites = favorites.filter((c) => c.toLowerCase() !== city.toLowerCase());
  saveFavorites(favorites);
  renderFavorites();
  showToast(`"${city}" removido dos favoritos.`);
  updateFavBtnState(); // Atualiza estado do botão após remover
}

// Atualiza a lista dos favoritos na UI
function renderFavorites() {
  const favorites = getFavorites();
  favoritesListEl.innerHTML = "";

  favorites.forEach((city) => {
    const li = document.createElement("li");
    li.tabIndex = 0;

    const citySpan = document.createElement("span");
    citySpan.textContent = city;
    citySpan.style.cursor = "pointer";
    citySpan.title = "Clique para buscar";
    citySpan.addEventListener("click", () => handleCitySelect(city));

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.title = `Remover ${city} dos favoritos`;
    removeBtn.setAttribute("role", "button");
    removeBtn.setAttribute("aria-label", `Remover ${city} dos favoritos`);
    removeBtn.setAttribute("tabindex", "0");
    Object.assign(removeBtn.style, {
      marginLeft: "8px",
      cursor: "pointer",
      background: "transparent",
      border: "none",
      color: "inherit",
      fontWeight: "bold",
      fontSize: "1.2rem",
      lineHeight: "1",
      padding: "0",
      outlineOffset: "2px",
    });

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFavorite(city);
    });

    li.addEventListener("keydown", (e) => {
      if (
        ["Delete", "Backspace"].includes(e.key) ||
        (e.key === "Enter" && e.shiftKey)
      ) {
        e.preventDefault();
        removeFavorite(city);
      }
    });

    li.title =
      "Clique para buscar. Pressione Shift+Enter ou Delete para remover dos favoritos.";

    li.appendChild(citySpan);
    li.appendChild(removeBtn);
    favoritesListEl.appendChild(li);
  });

  updateThemeColors();
}

// --- Atualiza o estado do botão Favoritos ---
function updateFavBtnState() {
  const city = cityInput.value.trim();
  // Botão desabilita se: input vazio, busca desabilitada, ou cidade já nos favoritos
  favBtn.disabled = city === "" || searchBtn.disabled || isFavorite(city);
}

// --- EVENTOS ---
// Atualiza o estado do botão sempre que input muda
cityInput.addEventListener("input", updateFavBtnState);

// Chama updateFavBtnState no carregamento e após renderizar favoritos
window.onload = () => {
  applySavedTheme();
  renderHistory();
  renderFavorites();

  updateFavBtnState();

  const lastCity = localStorage.getItem("lastCity");

  if (lastCity) {
    handleCitySelect(lastCity);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => handleCitySelect("São Miguel do Oeste")
    );
  } else {
    handleCitySelect("São Miguel do Oeste");
  }
};

// Atualiza botão após adicionar/remover favoritos já está coberto nas funções

// --- resto do seu código permanece igual ---

