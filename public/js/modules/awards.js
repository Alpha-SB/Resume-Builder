import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { escapeHtml, toDisplayValue } from '../utils/dom.js';

const buildAwardPayload = (objFormData) => {
  return {
    award_name: objFormData.get('award_name')?.trim() || '',
    issuing_organization: objFormData.get('issuing_organization')?.trim() || '',
    award_date: objFormData.get('award_date')?.trim() || '',
    description: objFormData.get('description')?.trim() || ''
  };
};

const renderAwardsSection = async (objContext) => {
  const { objState, objElements, showToast, confirmDialog, fnRefreshCurrentSection } = objContext;

  let arrRows = [];
  try {
    arrRows = await apiGet('/awards');
  } catch (objError) {
    showToast(`Unable to load awards: ${objError.message}`, 'error');
  }

  const objEditing = arrRows.find((objItem) => objItem.id === objState.intEditingAwardId) || null;

  const strTableRows = arrRows.length === 0
    ? '<tr><td colspan="4" class="text-center text-muted">No awards yet.</td></tr>'
    : arrRows.map((objItem) => `
      <tr>
        <td>${toDisplayValue(objItem.award_name)}</td>
        <td>${toDisplayValue(objItem.issuing_organization)}</td>
        <td>${toDisplayValue(objItem.award_date)}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${objItem.id}">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${objItem.id}">Delete</button>
        </td>
      </tr>
    `).join('');

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <h2 class="h4 mb-3">Awards</h2>

      <form id="awardForm" class="mb-4" novalidate>
        <input type="hidden" name="id" value="${objEditing?.id || ''}" />

        <div class="row g-3">
          <div class="col-md-6">
            <label for="awardName" class="form-label">Award Name <span aria-hidden="true">*</span></label>
            <input type="text" id="awardName" name="award_name" class="form-control" required value="${escapeHtml(objEditing?.award_name || '')}" />
          </div>
          <div class="col-md-6">
            <label for="awardOrg" class="form-label">Issuing Organization</label>
            <input type="text" id="awardOrg" name="issuing_organization" class="form-control" value="${escapeHtml(objEditing?.issuing_organization || '')}" />
          </div>
          <div class="col-md-4">
            <label for="awardDate" class="form-label">Award Date</label>
            <input type="text" id="awardDate" name="award_date" class="form-control" value="${escapeHtml(objEditing?.award_date || '')}" />
          </div>
          <div class="col-md-8">
            <label for="awardDescription" class="form-label">Description</label>
            <textarea id="awardDescription" name="description" class="form-control" rows="2">${escapeHtml(objEditing?.description || '')}</textarea>
          </div>
        </div>

        <div class="alert alert-danger mt-3 d-none" data-award-error></div>

        <div class="mt-3 d-flex gap-2">
          <button type="submit" class="btn btn-primary">${objEditing ? 'Update' : 'Add'} Award</button>
          <button type="button" class="btn btn-outline-secondary" id="awardResetButton">Reset</button>
        </div>
      </form>

      <div class="table-responsive">
        <table class="table table-striped align-middle">
          <thead>
            <tr>
              <th>Award</th>
              <th>Organization</th>
              <th>Date</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody id="awardTableBody">${strTableRows}</tbody>
        </table>
      </div>
    </div>
  `;

  const objForm = document.getElementById('awardForm');
  const objError = objForm.querySelector('[data-award-error]');
  const objTableBody = document.getElementById('awardTableBody');

  const setError = (strMessage = '') => {
    objError.textContent = strMessage;
    objError.classList.toggle('d-none', !strMessage);
  };

  objForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setError('');

    const objFormData = new FormData(objForm);
    const objPayload = buildAwardPayload(objFormData);

    if (!objPayload.award_name) {
      setError('Award name is required.');
      return;
    }

    try {
      const intId = Number(objFormData.get('id'));
      if (Number.isInteger(intId) && intId > 0) {
        await apiPut(`/awards/${intId}`, objPayload);
        showToast('Award updated.');
      } else {
        await apiPost('/awards', objPayload);
        showToast('Award added.');
      }

      objState.intEditingAwardId = null;
      await fnRefreshCurrentSection();
    } catch (objError) {
      setError(objError.message || 'Unable to save award.');
      showToast(objError.message || 'Unable to save award.', 'error');
    }
  });

  document.getElementById('awardResetButton').addEventListener('click', async () => {
    objState.intEditingAwardId = null;
    await fnRefreshCurrentSection();
  });

  objTableBody.addEventListener('click', async (objEvent) => {
    const objButton = objEvent.target.closest('button[data-action]');
    if (!objButton) {
      return;
    }

    const intId = Number(objButton.getAttribute('data-id'));
    const strAction = objButton.getAttribute('data-action');

    if (strAction === 'edit') {
      objState.intEditingAwardId = intId;
      await fnRefreshCurrentSection();
      return;
    }

    if (strAction === 'delete') {
      const blnConfirmed = await confirmDialog('Delete this award?', 'Delete Award');
      if (!blnConfirmed) {
        return;
      }

      try {
        await apiDelete(`/awards/${intId}`);
        if (objState.intEditingAwardId === intId) {
          objState.intEditingAwardId = null;
        }
        showToast('Award deleted.');
        await fnRefreshCurrentSection();
      } catch (objError) {
        showToast(objError.message || 'Unable to delete award.', 'error');
      }
    }
  });
};

const objAwardsModule = {
  strTitle: 'Awards',
  renderSection: renderAwardsSection
};

export { objAwardsModule };
