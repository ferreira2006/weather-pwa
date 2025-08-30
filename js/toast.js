// ================== Toast ==================
export const Toast = (() => {
  let toastEl;
  return {
    show(msg, type = 'default') {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast';
        document.body.appendChild(toastEl);
      }

      toastEl.textContent = msg;
      toastEl.className = 'toast show'; // reset
      if (type === 'add') toastEl.classList.add('add');
      else if (type === 'remove') toastEl.classList.add('remove');

      clearTimeout(toastEl._timeout);
      toastEl._timeout = setTimeout(() => {
        toastEl.classList.remove('show', 'add', 'remove');
      }, 3000);
    },
  };
})();
