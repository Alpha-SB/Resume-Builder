import { byId } from './utils/dom.js';
import { createInitialState } from './state.js';
import { initializeRouter } from './router.js';
import { initializeToastSystem } from './components/toast.js';
import { initializeModalHelpers } from './components/modal.js';
import { initializeConfirmDialog } from './components/confirmDialog.js';

const startApplication = () => {
  const objState = createInitialState();

  const objElements = {
    objViewTitle: byId('viewTitle'),
    objViewContainer: byId('viewContainer')
  };

  const { showToast } = initializeToastSystem();
  const {
    showModal,
    hideModal,
    getModalElement
  } = initializeModalHelpers();
  const { confirmDialog } = initializeConfirmDialog();

  initializeRouter({
    objState,
    objElements,
    showToast,
    showModal,
    hideModal,
    getModalElement,
    confirmDialog
  });
};

startApplication();
