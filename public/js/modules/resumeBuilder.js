import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { escapeHtml } from '../utils/dom.js';

const createItemSelectionSet = (arrItems) => {
  const setSelections = new Set();

  (arrItems || []).forEach((objItem) => {
    setSelections.add(`${objItem.item_type}:${objItem.item_id}`);
  });

  return setSelections;
};

const isChecked = ({
  setSelections,
  strItemType,
  intItemId,
  blnUseSavedSelections
}) => {
  if (blnUseSavedSelections) {
    return setSelections.has(`${strItemType}:${intItemId}`);
  }

  return true;
};

const buildCheckbox = ({ strItemType, intItemId, strLabel, blnChecked }) => {
  return `
    <div class="form-check mb-1">
      <input
        class="form-check-input"
        type="checkbox"
        id="${strItemType}-${intItemId}"
        value="${intItemId}"
        data-item-type="${strItemType}"
        ${blnChecked ? 'checked' : ''}
      />
      <label class="form-check-label" for="${strItemType}-${intItemId}">${strLabel}</label>
    </div>
  `;
};

const buildCoverLetterResumeOptions = (arrResumes, intSelectedResumeId) => {
  return ['<option value="">Choose a saved resume</option>']
    .concat((arrResumes || []).map((objResume) => `
      <option value="${objResume.id}" ${objResume.id === intSelectedResumeId ? 'selected' : ''}>
        ${escapeHtml(objResume.resume_name)}
      </option>
    `))
    .join('');
};

const renderCoverLetterNotes = (arrNotes) => {
  if (!Array.isArray(arrNotes) || arrNotes.length === 0) {
    return '<li class="text-muted">No notes yet.</li>';
  }

  return arrNotes.map((strNote) => `<li>${escapeHtml(strNote || '')}</li>`).join('');
};

const renderResumeBuilderSection = async (objContext) => {
  const {
    objState,
    objElements,
    showToast,
    confirmDialog,
    fnRefreshCurrentSection,
    fnNavigate
  } = objContext;

  let arrResumes = [];
  let arrEducation = [];
  let arrExperiences = [];
  let arrBullets = [];
  let arrSkillCategories = [];
  let arrSkills = [];
  let arrCertifications = [];
  let arrAwards = [];

  try {
    [
      arrResumes,
      arrEducation,
      arrExperiences,
      arrBullets,
      arrSkillCategories,
      arrSkills,
      arrCertifications,
      arrAwards
    ] = await Promise.all([
      apiGet('/resumes'),
      apiGet('/education'),
      apiGet('/experience'),
      apiGet('/experience/bullets'),
      apiGet('/skills/categories'),
      apiGet('/skills'),
      apiGet('/certifications'),
      apiGet('/awards')
    ]);
  } catch (objError) {
    showToast(`Unable to load resume builder data: ${objError.message}`, 'error');
  }

  let objResumeDetail = null;
  const intCurrentResumeId = Number(objState.intCurrentResumeId);

  if (Number.isInteger(intCurrentResumeId) && intCurrentResumeId > 0) {
    try {
      objResumeDetail = await apiGet(`/resumes/${intCurrentResumeId}`);
    } catch (objError) {
      showToast(`Unable to load selected resume: ${objError.message}`, 'error');
      objResumeDetail = null;
    }
  }

  const objSelectedResume = objResumeDetail?.resume || null;
  const setItemSelections = createItemSelectionSet(objResumeDetail?.items || []);
  const blnUseSavedSelections = Boolean(objResumeDetail);

  const strResumeOptions = ['<option value="">Create New Resume</option>']
    .concat((arrResumes || []).map((objResume) => `
      <option value="${objResume.id}" ${objResume.id === intCurrentResumeId ? 'selected' : ''}>
        ${escapeHtml(objResume.resume_name)}
      </option>
    `))
    .join('');

  const mapBulletsByExperience = new Map();
  (arrBullets || []).forEach((objBullet) => {
    if (!mapBulletsByExperience.has(objBullet.experience_id)) {
      mapBulletsByExperience.set(objBullet.experience_id, []);
    }

    mapBulletsByExperience.get(objBullet.experience_id).push(objBullet);
  });

  const strEducationHtml = (arrEducation || []).length === 0
    ? '<p class="text-muted">No education entries found.</p>'
    : arrEducation.map((objEducation) => buildCheckbox({
      strItemType: 'education',
      intItemId: objEducation.id,
      strLabel: `${escapeHtml(objEducation.school_name)} ${objEducation.degree ? `- ${escapeHtml(objEducation.degree)}` : ''}`,
      blnChecked: isChecked({
        setSelections: setItemSelections,
        strItemType: 'education',
        intItemId: objEducation.id,
        blnUseSavedSelections
      })
    })).join('');

  const strExperienceHtml = (arrExperiences || []).length === 0
    ? '<p class="text-muted">No experience entries found.</p>'
    : arrExperiences.map((objExperience) => {
      const strExperienceCheckbox = buildCheckbox({
        strItemType: 'experience',
        intItemId: objExperience.id,
        strLabel: `${escapeHtml(objExperience.job_title)} - ${escapeHtml(objExperience.company_name)}`,
        blnChecked: isChecked({
          setSelections: setItemSelections,
          strItemType: 'experience',
          intItemId: objExperience.id,
          blnUseSavedSelections
        })
      });

      const arrExperienceBullets = mapBulletsByExperience.get(objExperience.id) || [];
      const strBulletHtml = arrExperienceBullets.length === 0
        ? '<p class="text-muted ms-4 mb-0">No bullets for this experience yet.</p>'
        : arrExperienceBullets.map((objBullet) => buildCheckbox({
          strItemType: 'experience_bullet',
          intItemId: objBullet.id,
          strLabel: escapeHtml(objBullet.bullet_text),
          blnChecked: isChecked({
            setSelections: setItemSelections,
            strItemType: 'experience_bullet',
            intItemId: objBullet.id,
            blnUseSavedSelections
          })
        })).join('');

      return `
        <div class="border rounded p-2 mb-2">
          ${strExperienceCheckbox}
          <div class="ms-4 mt-2">
            <strong class="small">Bullets</strong>
            ${strBulletHtml}
          </div>
        </div>
      `;
    }).join('');

  const mapSkillsByCategoryId = new Map();
  (arrSkills || []).forEach((objSkill) => {
    const intCategoryId = objSkill.skill_category_id || 0;
    if (!mapSkillsByCategoryId.has(intCategoryId)) {
      mapSkillsByCategoryId.set(intCategoryId, []);
    }
    mapSkillsByCategoryId.get(intCategoryId).push(objSkill);
  });

  const strSkillsHtml = (arrSkillCategories || []).length === 0 && (arrSkills || []).length === 0
    ? '<p class="text-muted">No skills found.</p>'
    : `
      ${(arrSkillCategories || []).map((objCategory) => {
        const strCategoryCheckbox = buildCheckbox({
          strItemType: 'skill_category',
          intItemId: objCategory.id,
          strLabel: escapeHtml(objCategory.category_name),
          blnChecked: isChecked({
            setSelections: setItemSelections,
            strItemType: 'skill_category',
            intItemId: objCategory.id,
            blnUseSavedSelections
          })
        });

        const arrCategorySkills = mapSkillsByCategoryId.get(objCategory.id) || [];
        const strCategorySkillsHtml = arrCategorySkills.length === 0
          ? '<p class="text-muted ms-4 mb-0">No skills in this category.</p>'
          : arrCategorySkills.map((objSkill) => buildCheckbox({
            strItemType: 'skill',
            intItemId: objSkill.id,
            strLabel: escapeHtml(objSkill.skill_name),
            blnChecked: isChecked({
              setSelections: setItemSelections,
              strItemType: 'skill',
              intItemId: objSkill.id,
              blnUseSavedSelections
            })
          })).join('');

        return `
          <div class="border rounded p-2 mb-2">
            ${strCategoryCheckbox}
            <div class="ms-4 mt-2">
              ${strCategorySkillsHtml}
            </div>
          </div>
        `;
      }).join('')}

      ${((mapSkillsByCategoryId.get(0) || []).length > 0) ? `
        <div class="border rounded p-2 mb-2">
          <p class="mb-1"><strong>General Skills</strong></p>
          ${(mapSkillsByCategoryId.get(0) || []).map((objSkill) => buildCheckbox({
            strItemType: 'skill',
            intItemId: objSkill.id,
            strLabel: escapeHtml(objSkill.skill_name),
            blnChecked: isChecked({
              setSelections: setItemSelections,
              strItemType: 'skill',
              intItemId: objSkill.id,
              blnUseSavedSelections
            })
          })).join('')}
        </div>
      ` : ''}
    `;

  const strCertificationsHtml = (arrCertifications || []).length === 0
    ? '<p class="text-muted">No certifications found.</p>'
    : arrCertifications.map((objCertification) => buildCheckbox({
      strItemType: 'certification',
      intItemId: objCertification.id,
      strLabel: escapeHtml(objCertification.certification_name),
      blnChecked: isChecked({
        setSelections: setItemSelections,
        strItemType: 'certification',
        intItemId: objCertification.id,
        blnUseSavedSelections
      })
    })).join('');

  const strAwardsHtml = (arrAwards || []).length === 0
    ? '<p class="text-muted">No awards found.</p>'
    : arrAwards.map((objAward) => buildCheckbox({
      strItemType: 'award',
      intItemId: objAward.id,
      strLabel: escapeHtml(objAward.award_name),
      blnChecked: isChecked({
        setSelections: setItemSelections,
        strItemType: 'award',
        intItemId: objAward.id,
        blnUseSavedSelections
      })
    })).join('');

  const intCoverLetterResumeId = Number(objState.intCoverLetterResumeId)
    || intCurrentResumeId
    || Number(objSelectedResume?.id)
    || 0;

  const objCoverLetterResume = (arrResumes || []).find((objResume) => objResume.id === intCoverLetterResumeId) || null;

  const strCoverLetterJobTitle = objState.strCoverLetterJobTitle
    || objCoverLetterResume?.target_job_title
    || '';
  const strCoverLetterCompanyName = objState.strCoverLetterCompanyName
    || objCoverLetterResume?.target_company
    || '';
  const strCoverLetterJobDescription = objState.strCoverLetterJobDescription
    || objCoverLetterResume?.target_job_description
    || objState.strAiTargetJobDescription
    || '';

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <h2 class="h4 mb-3">Resume Builder</h2>

      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <label for="resumeSelector" class="form-label">Select Existing Resume</label>
          <select id="resumeSelector" class="form-select">${strResumeOptions}</select>
        </div>
        <div class="col-md-6 d-flex align-items-end gap-2">
          <button type="button" class="btn btn-outline-secondary" id="resumeNewButton">New Resume</button>
          <button type="button" class="btn btn-outline-danger" id="resumeDeleteButton" ${objSelectedResume ? '' : 'disabled'}>Delete Selected</button>
          <button type="button" class="btn btn-outline-primary" id="resumePreviewButton" ${objSelectedResume ? '' : 'disabled'}>Open Preview</button>
        </div>
      </div>

      <form id="resumeBuilderForm" novalidate>
        <input type="hidden" name="resume_id" value="${objSelectedResume?.id || ''}" />

        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <label for="resumeName" class="form-label">Resume Name <span aria-hidden="true">*</span></label>
            <input id="resumeName" name="resume_name" class="form-control" required value="${escapeHtml(objSelectedResume?.resume_name || '')}" />
          </div>
          <div class="col-md-4">
            <label for="targetJobTitle" class="form-label">Target Job Title</label>
            <input id="targetJobTitle" name="target_job_title" class="form-control" value="${escapeHtml(objSelectedResume?.target_job_title || '')}" />
          </div>
          <div class="col-md-4">
            <label for="targetCompany" class="form-label">Target Company</label>
            <input id="targetCompany" name="target_company" class="form-control" value="${escapeHtml(objSelectedResume?.target_company || '')}" />
          </div>
          <div class="col-12">
            <label for="targetJobDescription" class="form-label">Target Job Description</label>
            <textarea id="targetJobDescription" name="target_job_description" class="form-control" rows="4">${escapeHtml(objSelectedResume?.target_job_description || objState.strAiTargetJobDescription || '')}</textarea>
          </div>
        </div>

        <div class="accordion mb-3" id="resumeBuilderAccordion">
          <div class="accordion-item">
            <h3 class="accordion-header" id="headingEducation">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseEducation" aria-expanded="true" aria-controls="collapseEducation">Education</button>
            </h3>
            <div id="collapseEducation" class="accordion-collapse collapse show" aria-labelledby="headingEducation" data-bs-parent="#resumeBuilderAccordion">
              <div class="accordion-body">${strEducationHtml}</div>
            </div>
          </div>

          <div class="accordion-item">
            <h3 class="accordion-header" id="headingExperience">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExperience" aria-expanded="false" aria-controls="collapseExperience">Experience and Bullets</button>
            </h3>
            <div id="collapseExperience" class="accordion-collapse collapse" aria-labelledby="headingExperience" data-bs-parent="#resumeBuilderAccordion">
              <div class="accordion-body">${strExperienceHtml}</div>
            </div>
          </div>

          <div class="accordion-item">
            <h3 class="accordion-header" id="headingSkills">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSkills" aria-expanded="false" aria-controls="collapseSkills">Skills and Categories</button>
            </h3>
            <div id="collapseSkills" class="accordion-collapse collapse" aria-labelledby="headingSkills" data-bs-parent="#resumeBuilderAccordion">
              <div class="accordion-body">${strSkillsHtml}</div>
            </div>
          </div>

          <div class="accordion-item">
            <h3 class="accordion-header" id="headingCertifications">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCertifications" aria-expanded="false" aria-controls="collapseCertifications">Certifications</button>
            </h3>
            <div id="collapseCertifications" class="accordion-collapse collapse" aria-labelledby="headingCertifications" data-bs-parent="#resumeBuilderAccordion">
              <div class="accordion-body">${strCertificationsHtml}</div>
            </div>
          </div>

          <div class="accordion-item">
            <h3 class="accordion-header" id="headingAwards">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAwards" aria-expanded="false" aria-controls="collapseAwards">Awards</button>
            </h3>
            <div id="collapseAwards" class="accordion-collapse collapse" aria-labelledby="headingAwards" data-bs-parent="#resumeBuilderAccordion">
              <div class="accordion-body">${strAwardsHtml}</div>
            </div>
          </div>
        </div>

        <div class="alert alert-danger d-none" id="resumeBuilderError"></div>

        <div class="d-flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary">Save Resume and Selections</button>
          <button type="button" class="btn btn-outline-secondary" id="resumeBuilderRefreshButton">Reload Builder Data</button>
        </div>
      </form>

      <hr class="my-4" />

      <section aria-labelledby="coverLetterHeading">
        <h3 id="coverLetterHeading" class="h5 mb-3">AI Cover Letter Generator</h3>
        <p class="text-muted mb-3">
          Generate a draft using selected resume facts and the target job details. Review and edit before using.
          AI must not invent facts, and nothing is auto-saved.
        </p>

        <form id="coverLetterForm" novalidate>
          <div class="row g-3">
            <div class="col-md-4">
              <label for="coverLetterResumeId" class="form-label">Saved Resume <span aria-hidden="true">*</span></label>
              <select id="coverLetterResumeId" class="form-select" name="resume_id">
                ${buildCoverLetterResumeOptions(arrResumes, intCoverLetterResumeId)}
              </select>
            </div>
            <div class="col-md-4">
              <label for="coverLetterJobTitle" class="form-label">Job Title <span aria-hidden="true">*</span></label>
              <input id="coverLetterJobTitle" name="job_title" class="form-control" value="${escapeHtml(strCoverLetterJobTitle)}" />
            </div>
            <div class="col-md-4">
              <label for="coverLetterCompanyName" class="form-label">Company Name</label>
              <input id="coverLetterCompanyName" name="company_name" class="form-control" value="${escapeHtml(strCoverLetterCompanyName)}" />
            </div>
            <div class="col-12">
              <label for="coverLetterJobDescription" class="form-label">Job Description <span aria-hidden="true">*</span></label>
              <textarea id="coverLetterJobDescription" name="job_description" class="form-control" rows="5">${escapeHtml(strCoverLetterJobDescription)}</textarea>
            </div>
            <div class="col-12">
              <div class="alert alert-danger d-none" id="coverLetterError" role="alert"></div>
            </div>
            <div class="col-12 d-flex flex-wrap gap-2">
              <button type="submit" class="btn btn-primary" id="generateCoverLetterButton">Generate Cover Letter</button>
              <button type="button" class="btn btn-outline-secondary" id="copyCoverLetterButton">Copy</button>
              <button type="button" class="btn btn-outline-danger" id="clearCoverLetterButton">Clear</button>
            </div>
            <div class="col-12">
              <label for="generatedCoverLetter" class="form-label">Generated Cover Letter (Editable)</label>
              <textarea id="generatedCoverLetter" class="form-control" rows="12">${escapeHtml(objState.strCoverLetterText || '')}</textarea>
            </div>
            <div class="col-12">
              <h4 class="h6">AI Notes</h4>
              <ul id="coverLetterNotes" class="mb-0">${renderCoverLetterNotes(objState.arrCoverLetterNotes)}</ul>
            </div>
          </div>
        </form>
      </section>
    </div>
  `;

  const objResumeSelector = document.getElementById('resumeSelector');
  const objForm = document.getElementById('resumeBuilderForm');
  const objErrorBox = document.getElementById('resumeBuilderError');
  const objDeleteButton = document.getElementById('resumeDeleteButton');
  const objPreviewButton = document.getElementById('resumePreviewButton');
  const objNewButton = document.getElementById('resumeNewButton');
  const objReloadButton = document.getElementById('resumeBuilderRefreshButton');

  const setError = (strMessage = '') => {
    objErrorBox.textContent = strMessage;
    objErrorBox.classList.toggle('d-none', !strMessage);
  };

  objResumeSelector.addEventListener('change', async () => {
    const intResumeId = Number(objResumeSelector.value);
    objState.intCurrentResumeId = Number.isInteger(intResumeId) && intResumeId > 0 ? intResumeId : null;

    await fnRefreshCurrentSection();
  });

  objNewButton.addEventListener('click', async () => {
    objState.intCurrentResumeId = null;
    await fnRefreshCurrentSection();
  });

  objDeleteButton.addEventListener('click', async () => {
    if (!objSelectedResume) {
      return;
    }

    const blnConfirmed = await confirmDialog(
      `Delete resume "${objSelectedResume.resume_name}"?`,
      'Delete Resume'
    );

    if (!blnConfirmed) {
      return;
    }

    try {
      await apiDelete(`/resumes/${objSelectedResume.id}`);
      objState.intCurrentResumeId = null;
      if (Number(objState.intCoverLetterResumeId) === Number(objSelectedResume.id)) {
        objState.intCoverLetterResumeId = null;
      }
      showToast('Resume deleted.');
      await fnRefreshCurrentSection();
    } catch (objError) {
      showToast(objError.message || 'Unable to delete resume.', 'error');
    }
  });

  objPreviewButton.addEventListener('click', () => {
    if (!objSelectedResume) {
      return;
    }

    objState.intCurrentResumeId = objSelectedResume.id;
    fnNavigate('resume-preview');
  });

  objReloadButton.addEventListener('click', async () => {
    await fnRefreshCurrentSection();
  });

  objForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setError('');

    const objFormData = new FormData(objForm);
    const strResumeName = (objFormData.get('resume_name') || '').trim();

    if (!strResumeName) {
      setError('Resume name is required.');
      return;
    }

    const objResumePayload = {
      resume_name: strResumeName,
      target_job_title: (objFormData.get('target_job_title') || '').trim(),
      target_company: (objFormData.get('target_company') || '').trim(),
      target_job_description: (objFormData.get('target_job_description') || '').trim()
    };

    const arrCheckedItems = Array.from(
      objForm.querySelectorAll('input[data-item-type]:checked')
    );

    const arrResumeItemsPayload = arrCheckedItems.map((objCheckbox, intIndex) => ({
      item_type: objCheckbox.getAttribute('data-item-type'),
      item_id: Number(objCheckbox.value),
      sort_order: intIndex
    }));

    try {
      const intCurrentId = Number(objFormData.get('resume_id'));
      let intSavedResumeId = intCurrentId;

      if (Number.isInteger(intCurrentId) && intCurrentId > 0) {
        await apiPut(`/resumes/${intCurrentId}`, objResumePayload);
      } else {
        const objCreated = await apiPost('/resumes', objResumePayload);
        intSavedResumeId = objCreated.id;
      }

      await apiPut(`/resumes/${intSavedResumeId}/items`, {
        items: arrResumeItemsPayload
      });

      objState.intCurrentResumeId = intSavedResumeId;
      objState.strAiTargetJobDescription = objResumePayload.target_job_description;

      showToast('Resume and selections saved.');
      await fnRefreshCurrentSection();
    } catch (objError) {
      setError(objError.message || 'Unable to save resume builder data.');
      showToast(objError.message || 'Unable to save resume builder data.', 'error');
    }
  });

  const objCoverLetterForm = document.getElementById('coverLetterForm');
  const objCoverLetterResumeId = document.getElementById('coverLetterResumeId');
  const objCoverLetterJobTitle = document.getElementById('coverLetterJobTitle');
  const objCoverLetterCompanyName = document.getElementById('coverLetterCompanyName');
  const objCoverLetterJobDescription = document.getElementById('coverLetterJobDescription');
  const objGeneratedCoverLetter = document.getElementById('generatedCoverLetter');
  const objCoverLetterNotes = document.getElementById('coverLetterNotes');
  const objCoverLetterError = document.getElementById('coverLetterError');
  const objGenerateCoverLetterButton = document.getElementById('generateCoverLetterButton');
  const objCopyCoverLetterButton = document.getElementById('copyCoverLetterButton');
  const objClearCoverLetterButton = document.getElementById('clearCoverLetterButton');

  const setCoverLetterError = (strMessage = '') => {
    objCoverLetterError.textContent = strMessage;
    objCoverLetterError.classList.toggle('d-none', !strMessage);
  };

  const syncCoverLetterDraftState = () => {
    objState.intCoverLetterResumeId = Number(objCoverLetterResumeId.value) || null;
    objState.strCoverLetterJobTitle = objCoverLetterJobTitle.value;
    objState.strCoverLetterCompanyName = objCoverLetterCompanyName.value;
    objState.strCoverLetterJobDescription = objCoverLetterJobDescription.value;
    objState.strCoverLetterText = objGeneratedCoverLetter.value;
  };

  const applyCoverLetterResumeDefaults = (intResumeId) => {
    const objResume = (arrResumes || []).find((objItem) => objItem.id === intResumeId);
    if (!objResume) {
      return;
    }

    if (!objCoverLetterJobTitle.value.trim()) {
      objCoverLetterJobTitle.value = objResume.target_job_title || '';
    }

    if (!objCoverLetterCompanyName.value.trim()) {
      objCoverLetterCompanyName.value = objResume.target_company || '';
    }

    if (!objCoverLetterJobDescription.value.trim()) {
      objCoverLetterJobDescription.value = objResume.target_job_description || '';
    }

    syncCoverLetterDraftState();
  };

  objCoverLetterResumeId.addEventListener('change', () => {
    const intResumeId = Number(objCoverLetterResumeId.value);
    objState.intCoverLetterResumeId = Number.isInteger(intResumeId) && intResumeId > 0
      ? intResumeId
      : null;

    applyCoverLetterResumeDefaults(intResumeId);
  });

  objCoverLetterJobTitle.addEventListener('input', syncCoverLetterDraftState);
  objCoverLetterCompanyName.addEventListener('input', syncCoverLetterDraftState);
  objCoverLetterJobDescription.addEventListener('input', syncCoverLetterDraftState);
  objGeneratedCoverLetter.addEventListener('input', syncCoverLetterDraftState);

  objCoverLetterForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setCoverLetterError('');

    const intResumeId = Number(objCoverLetterResumeId.value);
    const strJobTitle = objCoverLetterJobTitle.value.trim();
    const strCompanyName = objCoverLetterCompanyName.value.trim();
    const strJobDescription = objCoverLetterJobDescription.value.trim();

    if (!Number.isInteger(intResumeId) || intResumeId <= 0) {
      setCoverLetterError('Please choose a saved resume first.');
      return;
    }

    if (!strJobTitle) {
      setCoverLetterError('Job title is required.');
      return;
    }

    if (!strJobDescription) {
      setCoverLetterError('Job description is required.');
      return;
    }

    objGenerateCoverLetterButton.disabled = true;
    objGenerateCoverLetterButton.textContent = 'Generating...';

    try {
      const objResult = await apiPost('/ai/generate-cover-letter', {
        resumeId: intResumeId,
        jobTitle: strJobTitle,
        companyName: strCompanyName,
        jobDescription: strJobDescription
      });

      objGeneratedCoverLetter.value = objResult.coverLetter || '';
      objCoverLetterNotes.innerHTML = renderCoverLetterNotes(objResult.notes || []);

      objState.intCoverLetterResumeId = intResumeId;
      objState.strCoverLetterJobTitle = strJobTitle;
      objState.strCoverLetterCompanyName = strCompanyName;
      objState.strCoverLetterJobDescription = strJobDescription;
      objState.strCoverLetterText = objResult.coverLetter || '';
      objState.arrCoverLetterNotes = objResult.notes || [];

      showToast('Cover letter generated. Review and edit before using.');
    } catch (objError) {
      setCoverLetterError(objError.message || 'Unable to generate cover letter.');
      showToast(objError.message || 'Unable to generate cover letter.', 'error');
    } finally {
      objGenerateCoverLetterButton.disabled = false;
      objGenerateCoverLetterButton.textContent = 'Generate Cover Letter';
    }
  });

  objCopyCoverLetterButton.addEventListener('click', async () => {
    const strCoverLetterText = objGeneratedCoverLetter.value.trim();
    if (!strCoverLetterText) {
      setCoverLetterError('Generate or enter cover letter text before copying.');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(strCoverLetterText);
        showToast('Cover letter copied to clipboard.');
      } else {
        showToast('Clipboard API is not available in this browser.', 'error');
      }
    } catch (_objClipboardError) {
      showToast('Unable to copy cover letter text.', 'error');
    }
  });

  objClearCoverLetterButton.addEventListener('click', () => {
    objGeneratedCoverLetter.value = '';
    objCoverLetterNotes.innerHTML = renderCoverLetterNotes([]);
    setCoverLetterError('');

    objState.strCoverLetterText = '';
    objState.arrCoverLetterNotes = [];
  });
};

const objResumeBuilderModule = {
  strTitle: 'Resume Builder',
  renderSection: renderResumeBuilderSection
};

export { objResumeBuilderModule };
