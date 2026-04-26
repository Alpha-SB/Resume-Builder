import { apiGet, apiPut, apiDelete } from '../api.js';
import { escapeHtml } from '../utils/dom.js';

const renderSettingsSection = async (objContext) => {
  const { objElements, showToast, confirmDialog } = objContext;

  let strGeminiApiKey = '';
  let blnSettingsApiAvailable = true;

  try {
    const objSetting = await apiGet('/settings/gemini_api_key');
    strGeminiApiKey = objSetting?.setting_value || '';
  } catch (objError) {
    if (objError.intStatus === 404) {
      strGeminiApiKey = '';
    } else if (objError.intStatus === 501) {
      blnSettingsApiAvailable = false;
    } else {
      showToast(`Unable to load settings: ${objError.message}`, 'error');
    }
  }

  if (!blnSettingsApiAvailable) {
    objElements.objViewContainer.innerHTML = `
      <div class="section-card p-4">
        <h2 class="h4">Settings</h2>
        <div class="alert alert-warning mb-0" role="alert">
          Settings API is not available yet. This screen will be connected in a future pass.
        </div>
      </div>
    `;
    return;
  }

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <h2 class="h4 mb-3">Settings</h2>
      <p class="text-muted">
        Gemini API key is stored locally in your application database on this machine when saved.
      </p>

      <form id="settingsForm" novalidate>
        <div class="mb-3">
          <label for="geminiApiKey" class="form-label">Gemini API Key</label>
          <input
            type="password"
            id="geminiApiKey"
            name="gemini_api_key"
            class="form-control"
            value="${escapeHtml(strGeminiApiKey)}"
            autocomplete="off"
            aria-describedby="geminiHelp"
          />
          <div id="geminiHelp" class="form-text">
            This key is optional for now and will be used when AI review flows are enabled.
          </div>
        </div>

        <div class="alert alert-danger d-none" data-settings-error></div>

        <div class="d-flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary">Save Key</button>
          <button type="button" class="btn btn-outline-danger" id="clearGeminiKeyButton">Clear Key</button>
        </div>
      </form>
    </div>
  `;

  const objForm = document.getElementById('settingsForm');
  const objError = objForm.querySelector('[data-settings-error]');
  const objClearButton = document.getElementById('clearGeminiKeyButton');

  const setError = (strMessage = '') => {
    objError.textContent = strMessage;
    objError.classList.toggle('d-none', !strMessage);
  };

  objForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setError('');

    const strApiKey = (new FormData(objForm).get('gemini_api_key') || '').trim();
    if (!strApiKey) {
      setError('Enter an API key value or use Clear Key.');
      return;
    }

    try {
      await apiPut('/settings/gemini_api_key', {
        setting_value: strApiKey
      });
      showToast('Gemini API key saved.');
    } catch (objError) {
      setError(objError.message || 'Unable to save key.');
      showToast(objError.message || 'Unable to save key.', 'error');
    }
  });

  objClearButton.addEventListener('click', async () => {
    setError('');

    const blnConfirmed = await confirmDialog('Clear the saved Gemini API key?', 'Clear Key');
    if (!blnConfirmed) {
      return;
    }

    try {
      await apiDelete('/settings/gemini_api_key');
      const objInput = document.getElementById('geminiApiKey');
      objInput.value = '';
      showToast('Gemini API key cleared.');
    } catch (objError) {
      if (objError.intStatus === 404) {
        const objInput = document.getElementById('geminiApiKey');
        objInput.value = '';
        showToast('No saved key was found, input cleared anyway.');
        return;
      }

      setError(objError.message || 'Unable to clear key.');
      showToast(objError.message || 'Unable to clear key.', 'error');
    }
  });
};

const objSettingsModule = {
  strTitle: 'Settings',
  renderSection: renderSettingsSection
};

export { objSettingsModule };
