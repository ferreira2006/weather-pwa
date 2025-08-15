export function showConfirmationModal(message) {
  return new Promise(resolve => {
    const modal = document.getElementById("confirm-modal");
    const desc = document.getElementById("confirm-modal-desc");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");

    desc.textContent = message;
    modal.hidden = false;
    modal.focus();

    const cleanUp = () => { yesBtn.removeEventListener("click", onYes); noBtn.removeEventListener("click", onNo); };
    const onYes = () => { cleanUp(); modal.hidden = true; resolve(true); };
    const onNo = () => { cleanUp(); modal.hidden = true; resolve(false); };

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}
