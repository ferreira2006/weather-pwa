// ================== Toast ==================
const Toast = (() => {
  let toastEl;

  const _resetClasses = () => {
    toastEl?.classList.remove('show', 'add', 'remove');
  };

  return {
    show(msg, type = 'default') {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast';
        document.body.appendChild(toastEl);
      }

      _resetClasses();
      toastEl.textContent = msg;
      toastEl.classList.add('show');

      if (type === 'add') toastEl.classList.add('add');
      else if (type === 'remove') toastEl.classList.add('remove');

      clearTimeout(toastEl?._timeout);
      toastEl._timeout = setTimeout(_resetClasses, 3000);
    },
  };
})();

export { Toast };
