export const Utils = {
  capitalizeCityName(city) {
    return city
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  },

  normalizeCityInput(city) {
    return city ? city.replace(/[’‘]/g, "'").trim().replace(/\s+/g, " ") : "";
  },

  validCityRegex: /^[\p{L}\s'-]+$/u,
};
