let objSharedModalInstance = null;
let objSharedModalElement = null;

const buildSharedModal = () => {
  if (objSharedModalElement) {
    return;
  }

  objSharedModalElement = document.createElement('div');
  objSharedModalElement.className = 'modal fade';
  objSharedModalElement.tabIndex = -1;
  objSharedModalElement.setAttribute('aria-hidden', 'true');
  objSharedModalElement.id = 'sharedAppModal';
  objSharedModalElement.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title fs-5" id="sharedModalTitle">Details</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" id="sharedModalBody"></div>
      </div>
    </div>
  `;

  document.body.appendChild(objSharedModalElement);
  objSharedModalInstance = new bootstrap.Modal(objSharedModalElement);
};

const initializeModalHelpers = () => {
  buildSharedModal();

  const showModal = ({ strTitle, strBodyHtml }) => {
    const objTitleElement = document.getElementById('sharedModalTitle');
    const objBodyElement = document.getElementById('sharedModalBody');

    objTitleElement.textContent = strTitle || 'Details';
    objBodyElement.innerHTML = strBodyHtml || '';

    objSharedModalInstance.show();
  };

  const hideModal = () => {
    if (objSharedModalInstance) {
      objSharedModalInstance.hide();
    }
  };

  const getModalElement = () => objSharedModalElement;

  return {
    showModal,
    hideModal,
    getModalElement
  };
};

export { initializeModalHelpers };
