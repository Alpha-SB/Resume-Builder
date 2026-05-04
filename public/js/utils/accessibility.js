import { byId } from './dom.js';

const announceMessage = (strMessage) => {
  const objAnnouncer = byId('srAnnouncements');
  if (!objAnnouncer) {
    return;
  }

  objAnnouncer.textContent = '';
  window.setTimeout(() => {
    objAnnouncer.textContent = strMessage;
  }, 25);
};

const focusMainContent = () => {
  const objMain = byId('mainContent');
  if (objMain) {
    objMain.focus();
  }
};

const focusViewTitle = () => {
  const objTitle = byId('viewTitle');
  if (objTitle) {
    objTitle.setAttribute('tabindex', '-1');
    objTitle.focus();
  }
};

export {
  announceMessage,
  focusMainContent,
  focusViewTitle
};
