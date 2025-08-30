// ================== StorageManager ==================
export const StorageManager = {
  cache: JSON.parse(
    localStorage.getItem(STORAGE_KEY) || '{"historico":[],"favoritos":[]}'
  ),

  carregar() {
    return this.cache;
  },

  salvar(data) {
    this.cache = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};
