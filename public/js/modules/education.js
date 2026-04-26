import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { escapeHtml, toDisplayValue } from '../utils/dom.js';

const buildEducationPayload = (objFormData) => {
  return {
    school_name: objFormData.get('school_name')?.trim() || '',
    degree: objFormData.get('degree')?.trim() || '',
    major: objFormData.get('major')?.trim() || '',
    location: objFormData.get('location')?.trim() || '',
    start_date: objFormData.get('start_date')?.trim() || '',
    end_date: objFormData.get('end_date')?.trim() || '',
    gpa: objFormData.get('gpa')?.trim() || '',
    details: objFormData.get('details')?.trim() || ''
  };
};

const renderEducationSection = async (objContext) => {
  const { objState, objElements, showToast, confirmDialog, fnRefreshCurrentSection } = objContext;

  let arrEducation = [];
  try {
    arrEducation = await apiGet('/education');
  } catch (objError) {
    showToast(`Unable to load education records: ${objError.message}`, 'error');
  }

  const intEditingEducationId = objState.intEditingEducationId;
  const objEditingEducation = arrEducation.find((objItem) => objItem.id === intEditingEducationId) || null;

  const strRowsHtml = arrEducation.length === 0
    ? '<tr><td colspan="5" class="text-center text-muted">No education records yet.</td></tr>'
    : arrEducation.map((objEntry) => `
      <tr>
        <td>${toDisplayValue(objEntry.school_name)}</td>
        <td>${toDisplayValue(objEntry.degree)}</td>
        <td>${toDisplayValue(objEntry.major)}</td>
        <td>${toDisplayValue(objEntry.start_date)} - ${toDisplayValue(objEntry.end_date)}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${objEntry.id}">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${objEntry.id}">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `).join('');

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h4 mb-0">Education</h2>
        ${objEditingEducation ? '<span class="badge text-bg-warning">Editing Record</span>' : ''}
      </div>

      <form id="educationForm" novalidate>
        <input type="hidden" name="id" value="${objEditingEducation?.id || ''}" />
        <div class="row g-3">
          <div class="col-md-6">
            <label for="educationSchoolName" class="form-label">School Name <span aria-hidden="true">*</span></label>
            <input type="text" class="form-control" id="educationSchoolName" name="school_name" required value="${escapeHtml(objEditingEducation?.school_name || '')}" />
          </div>
          <div class="col-md-3">
            <label for="educationDegree" class="form-label">Degree</label>
            <input type="text" class="form-control" id="educationDegree" name="degree" value="${escapeHtml(objEditingEducation?.degree || '')}" />
          </div>
          <div class="col-md-3">
            <label for="educationMajor" class="form-label">Major</label>
            <input type="text" class="form-control" id="educationMajor" name="major" value="${escapeHtml(objEditingEducation?.major || '')}" />
          </div>
          <div class="col-md-4">
            <label for="educationLocation" class="form-label">Location</label>
            <input type="text" class="form-control" id="educationLocation" name="location" value="${escapeHtml(objEditingEducation?.location || '')}" />
          </div>
          <div class="col-md-2">
            <label for="educationStartDate" class="form-label">Start Date</label>
            <input type="text" class="form-control" id="educationStartDate" name="start_date" value="${escapeHtml(objEditingEducation?.start_date || '')}" />
          </div>
          <div class="col-md-2">
            <label for="educationEndDate" class="form-label">End Date</label>
            <input type="text" class="form-control" id="educationEndDate" name="end_date" value="${escapeHtml(objEditingEducation?.end_date || '')}" />
          </div>
          <div class="col-md-2">
            <label for="educationGpa" class="form-label">GPA</label>
            <input type="text" class="form-control" id="educationGpa" name="gpa" value="${escapeHtml(objEditingEducation?.gpa || '')}" />
          </div>
          <div class="col-12">
            <label for="educationDetails" class="form-label">Details</label>
            <textarea class="form-control" id="educationDetails" name="details" rows="3">${escapeHtml(objEditingEducation?.details || '')}</textarea>
          </div>
        </div>

        <div class="alert alert-danger mt-3 d-none" data-education-error role="alert"></div>

        <div class="mt-3 d-flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary">${objEditingEducation ? 'Update' : 'Add'} Education</button>
          <button type="button" class="btn btn-outline-secondary" id="educationResetButton">Reset Form</button>
        </div>
      </form>

      <hr class="my-4" />

      <div class="table-responsive">
        <table class="table table-striped align-middle">
          <thead>
            <tr>
              <th>School</th>
              <th>Degree</th>
              <th>Major</th>
              <th>Dates</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody id="educationTableBody">${strRowsHtml}</tbody>
        </table>
      </div>
    </div>
  `;

  const objForm = document.getElementById('educationForm');
  const objErrorBox = objForm.querySelector('[data-education-error]');
  const objResetButton = document.getElementById('educationResetButton');
  const objTableBody = document.getElementById('educationTableBody');

  const setError = (strMessage = '') => {
    objErrorBox.textContent = strMessage;
    objErrorBox.classList.toggle('d-none', !strMessage);
  };

  objForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setError('');

    const objFormData = new FormData(objForm);
    const objPayload = buildEducationPayload(objFormData);

    if (!objPayload.school_name) {
      setError('School name is required.');
      return;
    }

    try {
      const intEducationId = Number(objFormData.get('id'));

      if (Number.isInteger(intEducationId) && intEducationId > 0) {
        await apiPut(`/education/${intEducationId}`, objPayload);
        showToast('Education record updated.');
      } else {
        await apiPost('/education', objPayload);
        showToast('Education record added.');
      }

      objState.intEditingEducationId = null;
      await fnRefreshCurrentSection();
    } catch (objError) {
      setError(objError.message || 'Unable to save education record.');
      showToast(objError.message || 'Unable to save education record.', 'error');
    }
  });

  objResetButton.addEventListener('click', async () => {
    objState.intEditingEducationId = null;
    await fnRefreshCurrentSection();
  });

  objTableBody.addEventListener('click', async (objEvent) => {
    const objButton = objEvent.target.closest('button[data-action]');
    if (!objButton) {
      return;
    }

    const intEducationId = Number(objButton.getAttribute('data-id'));
    const strAction = objButton.getAttribute('data-action');

    if (!Number.isInteger(intEducationId) || intEducationId <= 0) {
      return;
    }

    if (strAction === 'edit') {
      objState.intEditingEducationId = intEducationId;
      await fnRefreshCurrentSection();
      return;
    }

    if (strAction === 'delete') {
      const blnConfirmed = await confirmDialog('Delete this education record?', 'Delete Education');
      if (!blnConfirmed) {
        return;
      }

      try {
        await apiDelete(`/education/${intEducationId}`);
        if (objState.intEditingEducationId === intEducationId) {
          objState.intEditingEducationId = null;
        }
        showToast('Education record deleted.');
        await fnRefreshCurrentSection();
      } catch (objError) {
        showToast(objError.message || 'Unable to delete education record.', 'error');
      }
    }
  });
};

const objEducationModule = {
  strTitle: 'Education',
  renderSection: renderEducationSection
};

export { objEducationModule };
