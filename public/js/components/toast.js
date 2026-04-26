import { byId } from '../utils/dom.js';

const initializeToastSystem = () => {
  const objToastContainer = byId('toastContainer');

  const showToast = (strMessage, strType = 'success', objOptions = {}) => {
    if (!objToastContainer) {
      return;
    }

    const blnDefaultAutoDismiss = strType !== 'error';
    const blnAutoDismiss = typeof objOptions.blnAutoDismiss === 'boolean'
      ? objOptions.blnAutoDismiss
      : blnDefaultAutoDismiss;
    const intDelay = Number.isInteger(objOptions.intDelay) ? objOptions.intDelay : 3500;

    const strColorClass = strType === 'error' ? 'text-bg-danger' : 'text-bg-success';

    const objToastElement = document.createElement('div');
    objToastElement.className = `toast align-items-center ${strColorClass} border-0`;
    objToastElement.setAttribute('role', 'alert');
    objToastElement.setAttribute('aria-live', 'assertive');
    objToastElement.setAttribute('aria-atomic', 'true');

    const objFlex = document.createElement('div');
    objFlex.className = 'd-flex';

    const objBody = document.createElement('div');
    objBody.className = 'toast-body';
    objBody.textContent = strMessage;

    const objCloseButton = document.createElement('button');
    objCloseButton.type = 'button';
    objCloseButton.className = 'btn-close btn-close-white me-2 m-auto';
    objCloseButton.setAttribute('data-bs-dismiss', 'toast');
    objCloseButton.setAttribute('aria-label', 'Close');

    objFlex.appendChild(objBody);
    objFlex.appendChild(objCloseButton);
    objToastElement.appendChild(objFlex);

    objToastContainer.appendChild(objToastElement);

    const objToast = new bootstrap.Toast(objToastElement, {
      autohide: blnAutoDismiss,
      delay: intDelay
    });
    objToast.show();

    objToastElement.addEventListener('hidden.bs.toast', () => {
      objToastElement.remove();
    });
  };

  return {
    showToast
  };
};

export { initializeToastSystem };
