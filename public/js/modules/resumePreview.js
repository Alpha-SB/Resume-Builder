import { apiGet } from '../api.js';
import { escapeHtml } from '../utils/dom.js';

const renderProfileHeaderHtml = (objProfile) => {
  if (!objProfile) {
    return '<p class="text-muted mb-0">No profile found. Add profile details first.</p>';
  }

  const strFullName = `${objProfile.first_name || ''} ${objProfile.last_name || ''}`.trim();

  const arrContactParts = [
    objProfile.email,
    objProfile.phone,
    [objProfile.city, objProfile.state].filter(Boolean).join(', '),
    objProfile.linkedin_url,
    objProfile.github_url,
    objProfile.portfolio_url
  ].filter(Boolean);

  return `
    <header class="mb-3 text-center">
      <h1 class="h3 mb-1">${escapeHtml(strFullName || 'Unnamed Candidate')}</h1>
      <p class="mb-1">${arrContactParts.map((strPart) => escapeHtml(strPart)).join(' | ')}</p>
      ${objProfile.professional_summary ? `<p class="mb-0">${escapeHtml(objProfile.professional_summary)}</p>` : ''}
    </header>
  `;
};

const renderEducationHtml = (arrEducation) => {
  if (!arrEducation || arrEducation.length === 0) {
    return '';
  }

  return `
    <section class="resume-section mb-3" aria-labelledby="previewEducationHeading">
      <h2 id="previewEducationHeading" class="h5 border-bottom pb-1">Education</h2>
      ${arrEducation.map((objEducation) => `
        <article class="mb-2">
          <h3 class="h6 mb-0">${escapeHtml(objEducation.school_name || '')}</h3>
          <p class="mb-0">${escapeHtml(objEducation.degree || '')} ${objEducation.major ? `, ${escapeHtml(objEducation.major)}` : ''}</p>
          <p class="mb-0 text-muted">${escapeHtml(objEducation.location || '')} ${objEducation.start_date ? `| ${escapeHtml(objEducation.start_date)}` : ''} ${objEducation.end_date ? `- ${escapeHtml(objEducation.end_date)}` : ''}</p>
          ${objEducation.details ? `<p class="mb-0">${escapeHtml(objEducation.details)}</p>` : ''}
        </article>
      `).join('')}
    </section>
  `;
};

const renderExperienceHtml = (arrExperiences) => {
  if (!arrExperiences || arrExperiences.length === 0) {
    return '';
  }

  return `
    <section class="resume-section mb-3" aria-labelledby="previewExperienceHeading">
      <h2 id="previewExperienceHeading" class="h5 border-bottom pb-1">Experience</h2>
      ${arrExperiences.map((objExperience) => `
        <article class="mb-2">
          <h3 class="h6 mb-0">${escapeHtml(objExperience.job_title || '')} - ${escapeHtml(objExperience.company_name || '')}</h3>
          <p class="mb-1 text-muted">${escapeHtml(objExperience.location || '')} ${objExperience.start_date ? `| ${escapeHtml(objExperience.start_date)}` : ''} ${objExperience.is_current ? '- Current' : objExperience.end_date ? `- ${escapeHtml(objExperience.end_date)}` : ''}</p>
          ${objExperience.description ? `<p class="mb-1">${escapeHtml(objExperience.description)}</p>` : ''}
          ${(objExperience.bullets && objExperience.bullets.length > 0) ? `
            <ul class="mb-0">
              ${objExperience.bullets.map((objBullet) => `<li>${escapeHtml(objBullet.bullet_text || '')}</li>`).join('')}
            </ul>
          ` : ''}
        </article>
      `).join('')}
    </section>
  `;
};

const renderSkillsHtml = (arrSkillsByCategory) => {
  if (!arrSkillsByCategory || arrSkillsByCategory.length === 0) {
    return '';
  }

  return `
    <section class="resume-section mb-3" aria-labelledby="previewSkillsHeading">
      <h2 id="previewSkillsHeading" class="h5 border-bottom pb-1">Skills</h2>
      ${arrSkillsByCategory.map((objCategory) => `
        <p class="mb-1"><strong>${escapeHtml(objCategory.category_name || 'General')}</strong>: ${
          (objCategory.skills || []).map((strSkill) => escapeHtml(strSkill || '')).join(', ')
        }</p>
      `).join('')}
    </section>
  `;
};

const renderCertificationsHtml = (arrCertifications) => {
  if (!arrCertifications || arrCertifications.length === 0) {
    return '';
  }

  return `
    <section class="resume-section mb-3" aria-labelledby="previewCertificationsHeading">
      <h2 id="previewCertificationsHeading" class="h5 border-bottom pb-1">Certifications</h2>
      <ul class="mb-0">
        ${arrCertifications.map((objCertification) => `
          <li>
            ${escapeHtml(objCertification.certification_name || '')}
            ${objCertification.issuing_organization ? `- ${escapeHtml(objCertification.issuing_organization)}` : ''}
          </li>
        `).join('')}
      </ul>
    </section>
  `;
};

const renderAwardsHtml = (arrAwards) => {
  if (!arrAwards || arrAwards.length === 0) {
    return '';
  }

  return `
    <section class="resume-section mb-3" aria-labelledby="previewAwardsHeading">
      <h2 id="previewAwardsHeading" class="h5 border-bottom pb-1">Awards</h2>
      <ul class="mb-0">
        ${arrAwards.map((objAward) => `
          <li>
            ${escapeHtml(objAward.award_name || '')}
            ${objAward.issuing_organization ? `- ${escapeHtml(objAward.issuing_organization)}` : ''}
          </li>
        `).join('')}
      </ul>
    </section>
  `;
};

const renderResumePreviewSection = async (objContext) => {
  const { objState, objElements, showToast, fnRefreshCurrentSection } = objContext;

  let arrResumes = [];
  try {
    arrResumes = await apiGet('/resumes');
  } catch (objError) {
    showToast(`Unable to load resume list: ${objError.message}`, 'error');
  }

  if (!arrResumes || arrResumes.length === 0) {
    objElements.objViewContainer.innerHTML = `
      <div class="section-card p-4">
        <h2 class="h4">Resume Preview</h2>
        <p class="text-muted mb-0">No saved resumes found. Build and save a resume first.</p>
      </div>
    `;
    return;
  }

  const intStateResumeId = Number(objState.intCurrentResumeId);
  const intSelectedResumeId = Number.isInteger(intStateResumeId) && intStateResumeId > 0
    ? intStateResumeId
    : arrResumes[0].id;

  objState.intCurrentResumeId = intSelectedResumeId;

  let objPreviewData = null;
  try {
    objPreviewData = await apiGet(`/resumes/${intSelectedResumeId}/preview`);
  } catch (objError) {
    showToast(`Unable to load preview data: ${objError.message}`, 'error');
  }

  const strResumeOptions = (arrResumes || []).map((objResume) => `
    <option value="${objResume.id}" ${objResume.id === intSelectedResumeId ? 'selected' : ''}>${escapeHtml(objResume.resume_name)}</option>
  `).join('');

  const strPreviewHtml = objPreviewData
    ? `
      <article class="resume-print-root resume-preview-document bg-white p-4 border rounded mt-3">
        ${renderProfileHeaderHtml(objPreviewData.profile)}
        ${renderEducationHtml(objPreviewData.education)}
        ${renderExperienceHtml(objPreviewData.experiences)}
        ${renderSkillsHtml(objPreviewData.skillsByCategory)}
        ${renderCertificationsHtml(objPreviewData.certifications)}
        ${renderAwardsHtml(objPreviewData.awards)}
      </article>
    `
    : '<div class="alert alert-warning mt-3 mb-0">Unable to render preview for this resume.</div>';

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <div class="no-print">
        <h2 class="h4 mb-3">Resume Preview</h2>

        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label for="previewResumeSelector" class="form-label">Choose Resume</label>
            <select id="previewResumeSelector" class="form-select">${strResumeOptions}</select>
          </div>
          <div class="col-md-6 d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline-secondary" id="previewReloadButton">Reload Preview</button>
            <button type="button" class="btn btn-primary" id="previewPrintButton">Print / Save as PDF</button>
          </div>
        </div>

        <p class="text-muted mt-3 mb-0">
          Tip: Use your browser print dialog and choose "Save as PDF" to export.
        </p>
      </div>

      ${strPreviewHtml}
    </div>
  `;

  const objSelector = document.getElementById('previewResumeSelector');
  const objReloadButton = document.getElementById('previewReloadButton');
  const objPrintButton = document.getElementById('previewPrintButton');

  objSelector.addEventListener('change', async () => {
    const intSelectedValue = Number(objSelector.value);
    objState.intCurrentResumeId = Number.isInteger(intSelectedValue) && intSelectedValue > 0
      ? intSelectedValue
      : null;

    await fnRefreshCurrentSection();
  });

  objReloadButton.addEventListener('click', async () => {
    await fnRefreshCurrentSection();
  });

  objPrintButton.addEventListener('click', () => {
    window.print();
  });
};

const objResumePreviewModule = {
  strTitle: 'Resume Preview',
  renderSection: renderResumePreviewSection
};

export { objResumePreviewModule };
