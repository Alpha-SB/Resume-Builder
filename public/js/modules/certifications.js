import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { escapeHtml, toDisplayValue } from '../utils/dom.js';

const buildCertificationPayload = (objFormData) => {
  return {
    certification_name: objFormData.get('certification_name')?.trim() || '',
    issuing_organization: objFormData.get('issuing_organization')?.trim() || '',
    issue_date: objFormData.get('issue_date')?.trim() || '',
    expiration_date: objFormData.get('expiration_date')?.trim() || '',
    credential_url: objFormData.get('credential_url')?.trim() || ''
  };
};

const renderCertificationsSection = async (objContext) => {
  const { objState, objElements, showToast, confirmDialog, fnRefreshCurrentSection } = objContext;

  let arrRows = [];
  try {
    arrRows = await apiGet('/certifications');
  } catch (objError) {
    showToast(`Unable to load certifications: ${objError.message}`, 'error');
  }

  const objEditing = arrRows.find((objItem) => objItem.id === objState.intEditingCertificationId) || null;

  const strTableRows = arrRows.length === 0
    ? '<tr><td colspan="5" class="text-center text-muted">No certifications yet.</td></tr>'
    : arrRows.map((objItem) => `
      <tr>
        <td>${toDisplayValue(objItem.certification_name)}</td>
        <td>${toDisplayValue(objItem.issuing_organization)}</td>
        <td>${toDisplayValue(objItem.issue_date)}</td>
        <td>${toDisplayValue(objItem.expiration_date)}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${objItem.id}">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${objItem.id}">Delete</button>
        </td>
      </tr>
    `).join('');

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <h2 class="h4 mb-3">Certifications</h2>

      <form id="certificationForm" class="mb-4" novalidate>
        <input type="hidden" name="id" value="${objEditing?.id || ''}" />

        <div class="row g-3">
          <div class="col-md-6">
            <label for="certificationName" class="form-label">Certification Name <span aria-hidden="true">*</span></label>
            <input type="text" id="certificationName" name="certification_name" class="form-control" required value="${escapeHtml(objEditing?.certification_name || '')}" />
          </div>
          <div class="col-md-6">
            <label for="certIssuingOrg" class="form-label">Issuing Organization</label>
            <input type="text" id="certIssuingOrg" name="issuing_organization" class="form-control" value="${escapeHtml(objEditing?.issuing_organization || '')}" />
          </div>
          <div class="col-md-4">
            <label for="certIssueDate" class="form-label">Issue Date</label>
            <input type="text" id="certIssueDate" name="issue_date" class="form-control" value="${escapeHtml(objEditing?.issue_date || '')}" />
          </div>
          <div class="col-md-4">
            <label for="certExpDate" class="form-label">Expiration Date</label>
            <input type="text" id="certExpDate" name="expiration_date" class="form-control" value="${escapeHtml(objEditing?.expiration_date || '')}" />
          </div>
          <div class="col-md-4">
            <label for="certUrl" class="form-label">Credential URL</label>
            <input type="url" id="certUrl" name="credential_url" class="form-control" value="${escapeHtml(objEditing?.credential_url || '')}" />
          </div>
        </div>

        <div class="alert alert-danger mt-3 d-none" data-cert-error></div>

        <div class="mt-3 d-flex gap-2">
          <button type="submit" class="btn btn-primary">${objEditing ? 'Update' : 'Add'} Certification</button>
          <button type="button" class="btn btn-outline-secondary" id="certResetButton">Reset</button>
        </div>
      </form>

      <div class="table-responsive">
        <table class="table table-striped align-middle">
          <thead>
            <tr>
              <th>Certification</th>
              <th>Organization</th>
              <th>Issue Date</th>
              <th>Expiration</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody id="certTableBody">${strTableRows}</tbody>
        </table>
      </div>
    </div>
  `;

  const objForm = document.getElementById('certificationForm');
  const objError = objForm.querySelector('[data-cert-error]');
  const objTableBody = document.getElementById('certTableBody');

  const setError = (strMessage = '') => {
    objError.textContent = strMessage;
    objError.classList.toggle('d-none', !strMessage);
  };

  objForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setError('');

    const objFormData = new FormData(objForm);
    const objPayload = buildCertificationPayload(objFormData);

    if (!objPayload.certification_name) {
      setError('Certification name is required.');
      return;
    }

    try {
      const intId = Number(objFormData.get('id'));
      if (Number.isInteger(intId) && intId > 0) {
        await apiPut(`/certifications/${intId}`, objPayload);
        showToast('Certification updated.');
      } else {
        await apiPost('/certifications', objPayload);
        showToast('Certification added.');
      }

      objState.intEditingCertificationId = null;
      await fnRefreshCurrentSection();
    } catch (objError) {
      setError(objError.message || 'Unable to save certification.');
      showToast(objError.message || 'Unable to save certification.', 'error');
    }
  });

  document.getElementById('certResetButton').addEventListener('click', async () => {
    objState.intEditingCertificationId = null;
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
      objState.intEditingCertificationId = intId;
      await fnRefreshCurrentSection();
      return;
    }

    if (strAction === 'delete') {
      const blnConfirmed = await confirmDialog('Delete this certification?', 'Delete Certification');
      if (!blnConfirmed) {
        return;
      }

      try {
        await apiDelete(`/certifications/${intId}`);
        if (objState.intEditingCertificationId === intId) {
          objState.intEditingCertificationId = null;
        }
        showToast('Certification deleted.');
        await fnRefreshCurrentSection();
      } catch (objError) {
        showToast(objError.message || 'Unable to delete certification.', 'error');
      }
    }
  });
};

const objCertificationsModule = {
  strTitle: 'Certifications',
  renderSection: renderCertificationsSection
};

export { objCertificationsModule };
