import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { escapeHtml, toDisplayValue, queryAll } from '../utils/dom.js';

const buildExperiencePayload = (objFormData) => {
  return {
    job_title: objFormData.get('job_title')?.trim() || '',
    company_name: objFormData.get('company_name')?.trim() || '',
    location: objFormData.get('location')?.trim() || '',
    start_date: objFormData.get('start_date')?.trim() || '',
    end_date: objFormData.get('end_date')?.trim() || '',
    is_current: objFormData.get('is_current') === 'on',
    description: objFormData.get('description')?.trim() || ''
  };
};

const buildBulletPayload = (objFormData) => {
  return {
    experience_id: Number(objFormData.get('experience_id')),
    bullet_text: objFormData.get('bullet_text')?.trim() || '',
    sort_order: Number(objFormData.get('sort_order')) || 0,
    ai_last_reviewed_at: objFormData.get('ai_last_reviewed_at')?.trim() || ''
  };
};

const groupBulletsByExperience = (arrBullets) => {
  const mapGrouped = new Map();

  arrBullets.forEach((objBullet) => {
    if (!mapGrouped.has(objBullet.experience_id)) {
      mapGrouped.set(objBullet.experience_id, []);
    }

    mapGrouped.get(objBullet.experience_id).push(objBullet);
  });

  return mapGrouped;
};

const formatAiList = (arrValues) => {
  if (!Array.isArray(arrValues) || arrValues.length === 0) {
    return '<p class="text-muted mb-0">No items provided.</p>';
  }

  return `
    <ul class="mb-0">
      ${arrValues.map((strValue) => `<li>${escapeHtml(strValue || '')}</li>`).join('')}
    </ul>
  `;
};

const buildAiReviewModalHtml = (objReviewResponse) => {
  return `
    <div>
      <h3 class="h6">Original</h3>
      <p>${escapeHtml(objReviewResponse.original || '')}</p>

      <h3 class="h6">Improved Version</h3>
      <p>${escapeHtml(objReviewResponse.improved || '')}</p>

      <h3 class="h6">ATS Version</h3>
      <p>${escapeHtml(objReviewResponse.atsVersion || '')}</p>

      <div class="row g-3 mt-2">
        <div class="col-md-4">
          <h4 class="h6">Issues</h4>
          ${formatAiList(objReviewResponse.issues)}
        </div>
        <div class="col-md-4">
          <h4 class="h6">Suggestions</h4>
          ${formatAiList(objReviewResponse.suggestions)}
        </div>
        <div class="col-md-4">
          <h4 class="h6">Questions For You</h4>
          ${formatAiList(objReviewResponse.questionsForUser)}
        </div>
      </div>

      <hr />

      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-primary" data-ai-action="accept-improved">Accept Improved</button>
        <button type="button" class="btn btn-outline-primary" data-ai-action="accept-ats">Accept ATS</button>
        <button type="button" class="btn btn-outline-secondary" data-ai-action="copy-improved">Copy Improved</button>
        <button type="button" class="btn btn-outline-secondary" data-ai-action="copy-ats">Copy ATS</button>
        <button type="button" class="btn btn-outline-dark" data-ai-action="cancel">Cancel</button>
      </div>
    </div>
  `;
};

const buildExperienceCardsHtml = (arrExperiences, mapBulletsByExperience) => {
  if (arrExperiences.length === 0) {
    return `
      <div class="empty-state p-4 text-center text-muted">
        No experience records yet.
      </div>
    `;
  }

  return arrExperiences.map((objExperience) => {
    const arrBullets = mapBulletsByExperience.get(objExperience.id) || [];

    const strBulletItemsHtml = arrBullets.length === 0
      ? '<li class="list-group-item text-muted">No bullets yet for this experience.</li>'
      : arrBullets.map((objBullet) => `
        <li class="list-group-item">
          <div class="d-flex flex-column flex-lg-row justify-content-between gap-2">
            <div>
              <div>${escapeHtml(objBullet.bullet_text || '')}</div>
              <small class="text-muted">Sort: ${escapeHtml(String(objBullet.sort_order ?? 0))}</small>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                data-bullet-action="edit"
                data-bullet-id="${objBullet.id}"
                data-experience-id="${objExperience.id}"
                data-bullet-text="${escapeHtml(objBullet.bullet_text || '')}"
                data-sort-order="${objBullet.sort_order ?? 0}"
                data-ai-reviewed="${escapeHtml(objBullet.ai_last_reviewed_at || '')}"
              >
                Edit
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                data-bullet-action="delete"
                data-bullet-id="${objBullet.id}"
              >
                Delete
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                data-bullet-action="ai"
                data-bullet-id="${objBullet.id}"
                data-bullet-text="${escapeHtml(objBullet.bullet_text || '')}"
              >
                AI Review
              </button>
            </div>
          </div>
        </li>
      `).join('');

    return `
      <article class="card mb-3" data-experience-card="${objExperience.id}">
        <div class="card-body">
          <div class="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
            <div>
              <h3 class="h5 mb-1">${toDisplayValue(objExperience.job_title)}</h3>
              <p class="mb-1">${toDisplayValue(objExperience.company_name)}</p>
              <p class="mb-1 text-muted">${toDisplayValue(objExperience.location)}</p>
              <p class="mb-0 text-muted">${toDisplayValue(objExperience.start_date)} - ${objExperience.is_current ? 'Current' : toDisplayValue(objExperience.end_date)}</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-content-start">
              <button type="button" class="btn btn-sm btn-outline-primary" data-experience-action="edit" data-id="${objExperience.id}">Edit Experience</button>
              <button type="button" class="btn btn-sm btn-outline-danger" data-experience-action="delete" data-id="${objExperience.id}">Delete Experience</button>
            </div>
          </div>

          <p class="mb-3">${toDisplayValue(objExperience.description)}</p>

          <h4 class="h6">Bullets</h4>
          <ul class="list-group mb-3">${strBulletItemsHtml}</ul>

          <form class="border rounded p-3" data-bullet-form="${objExperience.id}" novalidate>
            <input type="hidden" name="experience_id" value="${objExperience.id}" />
            <input type="hidden" name="bullet_id" value="" />
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label" for="bulletText${objExperience.id}">Bullet Text</label>
                <textarea class="form-control" id="bulletText${objExperience.id}" name="bullet_text" rows="2" required></textarea>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="bulletSort${objExperience.id}">Sort Order</label>
                <input class="form-control" id="bulletSort${objExperience.id}" name="sort_order" type="number" value="0" />
              </div>
              <div class="col-md-4">
                <label class="form-label" for="bulletReviewed${objExperience.id}">AI Last Reviewed At</label>
                <input class="form-control" id="bulletReviewed${objExperience.id}" name="ai_last_reviewed_at" type="text" placeholder="YYYY-MM-DD (optional)" />
              </div>
              <div class="col-md-5 d-flex align-items-end gap-2">
                <button type="submit" class="btn btn-primary">Save Bullet</button>
                <button type="button" class="btn btn-outline-secondary" data-bullet-clear="${objExperience.id}">Clear</button>
              </div>
            </div>
            <div class="alert alert-danger mt-2 d-none" data-bullet-error></div>
          </form>
        </div>
      </article>
    `;
  }).join('');
};

const renderExperienceSection = async (objContext) => {
  const {
    objState,
    objElements,
    showToast,
    showModal,
    hideModal,
    getModalElement,
    confirmDialog,
    fnRefreshCurrentSection
  } = objContext;

  let arrExperiences = [];
  let arrBullets = [];

  try {
    [arrExperiences, arrBullets] = await Promise.all([
      apiGet('/experience'),
      apiGet('/experience/bullets')
    ]);
  } catch (objError) {
    showToast(`Unable to load experience data: ${objError.message}`, 'error');
  }

  const mapBulletById = new Map((arrBullets || []).map((objBullet) => [objBullet.id, objBullet]));

  const objEditingExperience = arrExperiences.find((objItem) => objItem.id === objState.intEditingExperienceId) || null;
  const mapBulletsByExperience = groupBulletsByExperience(arrBullets || []);

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h4 mb-0">Experience</h2>
        ${objEditingExperience ? '<span class="badge text-bg-warning">Editing Experience</span>' : ''}
      </div>

      <div class="mb-4">
        <label for="experienceAiTargetJobDescription" class="form-label">Optional Target Job Description For AI Review</label>
        <textarea
          id="experienceAiTargetJobDescription"
          class="form-control"
          rows="3"
          placeholder="Paste a target job description to improve AI bullet relevance (optional)."
        >${escapeHtml(objState.strAiTargetJobDescription || '')}</textarea>
      </div>

      <form id="experienceForm" novalidate>
        <input type="hidden" name="id" value="${objEditingExperience?.id || ''}" />
        <div class="row g-3">
          <div class="col-md-6">
            <label for="experienceJobTitle" class="form-label">Job Title <span aria-hidden="true">*</span></label>
            <input type="text" class="form-control" id="experienceJobTitle" name="job_title" required value="${escapeHtml(objEditingExperience?.job_title || '')}" />
          </div>
          <div class="col-md-6">
            <label for="experienceCompanyName" class="form-label">Company Name <span aria-hidden="true">*</span></label>
            <input type="text" class="form-control" id="experienceCompanyName" name="company_name" required value="${escapeHtml(objEditingExperience?.company_name || '')}" />
          </div>
          <div class="col-md-4">
            <label for="experienceLocation" class="form-label">Location</label>
            <input type="text" class="form-control" id="experienceLocation" name="location" value="${escapeHtml(objEditingExperience?.location || '')}" />
          </div>
          <div class="col-md-3">
            <label for="experienceStartDate" class="form-label">Start Date</label>
            <input type="text" class="form-control" id="experienceStartDate" name="start_date" value="${escapeHtml(objEditingExperience?.start_date || '')}" />
          </div>
          <div class="col-md-3">
            <label for="experienceEndDate" class="form-label">End Date</label>
            <input type="text" class="form-control" id="experienceEndDate" name="end_date" value="${escapeHtml(objEditingExperience?.end_date || '')}" />
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="experienceIsCurrent" name="is_current" ${objEditingExperience?.is_current ? 'checked' : ''} />
              <label class="form-check-label" for="experienceIsCurrent">Current</label>
            </div>
          </div>
          <div class="col-12">
            <label for="experienceDescription" class="form-label">Description</label>
            <textarea class="form-control" id="experienceDescription" name="description" rows="3">${escapeHtml(objEditingExperience?.description || '')}</textarea>
          </div>
        </div>

        <div class="alert alert-danger mt-3 d-none" data-experience-error role="alert"></div>

        <div class="mt-3 d-flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary">${objEditingExperience ? 'Update' : 'Add'} Experience</button>
          <button type="button" class="btn btn-outline-secondary" id="experienceResetButton">Reset Form</button>
        </div>
      </form>

      <hr class="my-4" />

      <div id="experienceCards">
        ${buildExperienceCardsHtml(arrExperiences, mapBulletsByExperience)}
      </div>
    </div>
  `;

  const objTargetJobDescription = document.getElementById('experienceAiTargetJobDescription');
  objTargetJobDescription.addEventListener('input', () => {
    objState.strAiTargetJobDescription = objTargetJobDescription.value;
  });

  const objExperienceForm = document.getElementById('experienceForm');
  const objExperienceError = objExperienceForm.querySelector('[data-experience-error]');
  const objExperienceCards = document.getElementById('experienceCards');
  const objResetButton = document.getElementById('experienceResetButton');

  const setExperienceError = (strMessage = '') => {
    objExperienceError.textContent = strMessage;
    objExperienceError.classList.toggle('d-none', !strMessage);
  };

  objExperienceForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setExperienceError('');

    const objFormData = new FormData(objExperienceForm);
    const objPayload = buildExperiencePayload(objFormData);

    if (!objPayload.job_title || !objPayload.company_name) {
      setExperienceError('Job title and company name are required.');
      return;
    }

    try {
      const intExperienceId = Number(objFormData.get('id'));

      if (Number.isInteger(intExperienceId) && intExperienceId > 0) {
        await apiPut(`/experience/${intExperienceId}`, objPayload);
        showToast('Experience updated.');
      } else {
        await apiPost('/experience', objPayload);
        showToast('Experience added.');
      }

      objState.intEditingExperienceId = null;
      await fnRefreshCurrentSection();
    } catch (objError) {
      setExperienceError(objError.message || 'Unable to save experience.');
      showToast(objError.message || 'Unable to save experience.', 'error');
    }
  });

  objResetButton.addEventListener('click', async () => {
    objState.intEditingExperienceId = null;
    await fnRefreshCurrentSection();
  });

  objExperienceCards.addEventListener('click', async (objEvent) => {
    const objExperienceButton = objEvent.target.closest('button[data-experience-action]');
    const objBulletButton = objEvent.target.closest('button[data-bullet-action]');
    const objBulletClearButton = objEvent.target.closest('button[data-bullet-clear]');

    if (objExperienceButton) {
      const intExperienceId = Number(objExperienceButton.getAttribute('data-id'));
      const strAction = objExperienceButton.getAttribute('data-experience-action');

      if (strAction === 'edit') {
        objState.intEditingExperienceId = intExperienceId;
        await fnRefreshCurrentSection();
        return;
      }

      if (strAction === 'delete') {
        const blnConfirmed = await confirmDialog('Delete this experience and its bullets?', 'Delete Experience');
        if (!blnConfirmed) {
          return;
        }

        try {
          await apiDelete(`/experience/${intExperienceId}`);
          if (objState.intEditingExperienceId === intExperienceId) {
            objState.intEditingExperienceId = null;
          }
          showToast('Experience deleted.');
          await fnRefreshCurrentSection();
        } catch (objError) {
          showToast(objError.message || 'Unable to delete experience.', 'error');
        }
      }

      return;
    }

    if (objBulletButton) {
      const strBulletAction = objBulletButton.getAttribute('data-bullet-action');
      const intBulletId = Number(objBulletButton.getAttribute('data-bullet-id'));

      if (strBulletAction === 'ai') {
        const objBullet = mapBulletById.get(intBulletId);
        if (!objBullet) {
          showToast('Unable to find bullet for AI review.', 'error');
          return;
        }

        const strOriginalButtonText = objBulletButton.textContent;
        objBulletButton.disabled = true;
        objBulletButton.textContent = 'Reviewing...';

        try {
          const objReviewResponse = await apiPost('/ai/review-bullet', {
            bulletText: objBullet.bullet_text || '',
            targetJobDescription: (objTargetJobDescription.value || '').trim()
          });

          showModal({
            strTitle: 'AI Bullet Review',
            strBodyHtml: buildAiReviewModalHtml(objReviewResponse)
          });

          const objModalElement = getModalElement();
          const objModalBody = objModalElement?.querySelector('#sharedModalBody');

          if (objModalBody) {
            objModalBody.onclick = async (objModalEvent) => {
              const objActionButton = objModalEvent.target.closest('button[data-ai-action]');
              if (!objActionButton) {
                return;
              }

              const strAiAction = objActionButton.getAttribute('data-ai-action');

              if (strAiAction === 'cancel') {
                hideModal();
                return;
              }

              if (strAiAction === 'copy-improved' || strAiAction === 'copy-ats') {
                const strTextToCopy = strAiAction === 'copy-improved'
                  ? objReviewResponse.improved
                  : objReviewResponse.atsVersion;

                try {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(strTextToCopy || '');
                    showToast('Suggestion copied to clipboard.');
                  } else {
                    showToast('Clipboard API not available in this browser.', 'error');
                  }
                } catch (_objClipboardError) {
                  showToast('Unable to copy suggestion to clipboard.', 'error');
                }

                return;
              }

              if (strAiAction === 'accept-improved' || strAiAction === 'accept-ats') {
                const strAcceptedText = strAiAction === 'accept-improved'
                  ? objReviewResponse.improved
                  : objReviewResponse.atsVersion;

                try {
                  await apiPut(`/experience/bullets/${objBullet.id}`, {
                    experience_id: objBullet.experience_id,
                    bullet_text: strAcceptedText,
                    sort_order: objBullet.sort_order || 0,
                    ai_last_reviewed_at: new Date().toISOString()
                  });

                  hideModal();
                  showToast('AI suggestion accepted and saved.');
                  await fnRefreshCurrentSection();
                } catch (objSaveError) {
                  showToast(objSaveError.message || 'Unable to save accepted AI suggestion.', 'error');
                }
              }
            };
          }
        } catch (objError) {
          showToast(objError.message || 'Unable to complete AI review.', 'error');
        } finally {
          objBulletButton.disabled = false;
          objBulletButton.textContent = strOriginalButtonText;
        }

        return;
      }

      if (strBulletAction === 'delete') {
        const blnConfirmed = await confirmDialog('Delete this bullet?', 'Delete Bullet');
        if (!blnConfirmed) {
          return;
        }

        try {
          await apiDelete(`/experience/bullets/${intBulletId}`);
          showToast('Bullet deleted.');
          await fnRefreshCurrentSection();
        } catch (objError) {
          showToast(objError.message || 'Unable to delete bullet.', 'error');
        }

        return;
      }

      if (strBulletAction === 'edit') {
        const intExperienceId = Number(objBulletButton.getAttribute('data-experience-id'));
        const objBulletForm = document.querySelector(`form[data-bullet-form="${intExperienceId}"]`);
        if (!objBulletForm) {
          return;
        }

        objBulletForm.querySelector('input[name="bullet_id"]').value = String(intBulletId);
        objBulletForm.querySelector('textarea[name="bullet_text"]').value = objBulletButton.getAttribute('data-bullet-text') || '';
        objBulletForm.querySelector('input[name="sort_order"]').value = objBulletButton.getAttribute('data-sort-order') || '0';
        objBulletForm.querySelector('input[name="ai_last_reviewed_at"]').value = objBulletButton.getAttribute('data-ai-reviewed') || '';
      }

      return;
    }

    if (objBulletClearButton) {
      const intExperienceId = Number(objBulletClearButton.getAttribute('data-bullet-clear'));
      const objBulletForm = document.querySelector(`form[data-bullet-form="${intExperienceId}"]`);
      if (!objBulletForm) {
        return;
      }

      objBulletForm.reset();
      objBulletForm.querySelector('input[name="bullet_id"]').value = '';
      objBulletForm.querySelector('input[name="experience_id"]').value = String(intExperienceId);
      objBulletForm.querySelector('input[name="sort_order"]').value = '0';
      const objErrorBox = objBulletForm.querySelector('[data-bullet-error]');
      objErrorBox.textContent = '';
      objErrorBox.classList.add('d-none');
    }
  });

  const arrBulletForms = queryAll('form[data-bullet-form]', objExperienceCards);
  arrBulletForms.forEach((objBulletForm) => {
    objBulletForm.addEventListener('submit', async (objEvent) => {
      objEvent.preventDefault();

      const objErrorBox = objBulletForm.querySelector('[data-bullet-error]');
      const setBulletError = (strMessage = '') => {
        objErrorBox.textContent = strMessage;
        objErrorBox.classList.toggle('d-none', !strMessage);
      };

      setBulletError('');

      const objFormData = new FormData(objBulletForm);
      const objPayload = buildBulletPayload(objFormData);
      const intBulletId = Number(objFormData.get('bullet_id'));

      if (!objPayload.bullet_text) {
        setBulletError('Bullet text is required.');
        return;
      }

      try {
        if (Number.isInteger(intBulletId) && intBulletId > 0) {
          await apiPut(`/experience/bullets/${intBulletId}`, objPayload);
          showToast('Bullet updated.');
        } else {
          await apiPost('/experience/bullets', objPayload);
          showToast('Bullet added.');
        }

        await fnRefreshCurrentSection();
      } catch (objError) {
        setBulletError(objError.message || 'Unable to save bullet.');
        showToast(objError.message || 'Unable to save bullet.', 'error');
      }
    });
  });
};

const objExperienceModule = {
  strTitle: 'Experience',
  renderSection: renderExperienceSection
};

export { objExperienceModule };
