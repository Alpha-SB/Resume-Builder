let objConfirmModalInstance = null;
let objConfirmModalElement = null;

const buildConfirmModal = () => {
  if (objConfirmModalElement) {
    return;
  }

  objConfirmModalElement = document.createElement('div');
  objConfirmModalElement.className = 'modal fade';
  objConfirmModalElement.tabIndex = -1;
  objConfirmModalElement.setAttribute('aria-hidden', 'true');
  objConfirmModalElement.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title fs-5" id="confirmModalTitle">Please Confirm</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" id="confirmModalBody"></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirmModalOkButton">Confirm</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(objConfirmModalElement);
  objConfirmModalInstance = new bootstrap.Modal(objConfirmModalElement);
};

const initializeConfirmDialog = () => {
  buildConfirmModal();

  const confirmDialog = async (strMessage, strTitle = 'Please Confirm') => {
    const objTitleElement = document.getElementById('confirmModalTitle');
    const objBodyElement = document.getElementById('confirmModalBody');
    const objOkButton = document.getElementById('confirmModalOkButton');

    objTitleElement.textContent = strTitle;
    objBodyElement.textContent = strMessage;

    return new Promise((resolve) => {
      let blnHandled = false;

      const fnHandleCancel = () => {
        if (!blnHandled) {
          blnHandled = true;
          cleanup();
          resolve(false);
        }
      };

      const fnHandleConfirm = () => {
        if (!blnHandled) {
          blnHandled = true;
          cleanup();
          objConfirmModalInstance.hide();
          resolve(true);
        }
      };

      const cleanup = () => {
        objOkButton.removeEventListener('click', fnHandleConfirm);
        objConfirmModalElement.removeEventListener('hidden.bs.modal', fnHandleCancel);
      };

      objOkButton.addEventListener('click', fnHandleConfirm);
      objConfirmModalElement.addEventListener('hidden.bs.modal', fnHandleCancel, { once: true });

      objConfirmModalInstance.show();
    });
  };

  return {
    confirmDialog
  };
};

export { initializeConfirmDialog };
