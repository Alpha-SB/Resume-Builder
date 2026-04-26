// Small DOM helpers keep module files easier to read for beginners.
const byId = (strElementId) => document.getElementById(strElementId);

const queryOne = (strSelector, objRoot = document) => objRoot.querySelector(strSelector);

const queryAll = (strSelector, objRoot = document) => Array.from(objRoot.querySelectorAll(strSelector));

const clearElement = (objElement) => {
  if (objElement) {
    objElement.innerHTML = '';
  }
};

const setText = (objElement, strText) => {
  if (objElement) {
    objElement.textContent = strText;
  }
};

const setHtml = (objElement, strHtml) => {
  if (objElement) {
    objElement.innerHTML = strHtml;
  }
};

const escapeHtml = (strValue) => {
  const objDiv = document.createElement('div');
  objDiv.textContent = strValue ?? '';
  return objDiv.innerHTML;
};

const toDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '<span class="text-muted">N/A</span>';
  }

  return escapeHtml(String(value));
};

export {
  byId,
  queryOne,
  queryAll,
  clearElement,
  setText,
  setHtml,
  escapeHtml,
  toDisplayValue
};
