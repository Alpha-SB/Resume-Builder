import { apiGet } from '../api.js';
import { escapeHtml } from '../utils/dom.js';

const arrPrintModeClasses = ['print-resume', 'print-cover-letter', 'print-both'];
let blnAfterPrintListenerBound = false;

const clearPrintModeClasses = () => {
  document.body.classList.remove(...arrPrintModeClasses);
};

const ensureAfterPrintCleanup = () => {
  if (blnAfterPrintListenerBound) {
    return;
  }

  // Beginner-friendly note:
  // `afterprint` runs after the print dialog closes (print or cancel),
  // so we can always clear temporary print mode classes.
  window.addEventListener('afterprint', () => {
    clearPrintModeClasses();
  });

  blnAfterPrintListenerBound = true;
};

const runPrintForMode = (strPrintMode) => {
  // Browser date/title/URL/page-number headers are controlled by the print dialog.
  // The app controls resume layout with print CSS, but users must disable
  // "Headers and footers" in the browser print settings for a clean PDF.
  clearPrintModeClasses();
  document.body.classList.add(strPrintMode);

  window.print();

  // Fallback cleanup in case a browser does not reliably fire `afterprint`.
  setTimeout(() => {
    clearPrintModeClasses();
  }, 1000);
};

const buildContactParts = (objProfile) => {
  return [
    objProfile?.email,
    objProfile?.phone,
    [objProfile?.city, objProfile?.state].filter(Boolean).join(', '),
    objProfile?.linkedin_url,
    objProfile?.github_url,
    objProfile?.portfolio_url
  ].filter(Boolean);
};

const renderProfileHeaderHtml = (objProfile) => {
  if (!objProfile) {
    return '<p class="text-muted mb-0">No profile found. Add profile details first.</p>';
  }

  const strFullName = `${objProfile.first_name || ''} ${objProfile.last_name || ''}`.trim();
  const arrContactParts = buildContactParts(objProfile);

  return `
    <h1 class="h3 mb-1">${escapeHtml(strFullName || 'Unnamed Candidate')}</h1>
    <p class="mb-1">${arrContactParts.map((strPart) => escapeHtml(strPart)).join(' | ')}</p>
    ${objProfile.professional_summary ? `<p class="mb-0">${escapeHtml(objProfile.professional_summary)}</p>` : ''}
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
        <article class="mb-2 resume-entry">
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
        <article class="mb-2 resume-entry">
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
        <p class="mb-1 resume-entry"><strong>${escapeHtml(objCategory.category_name || 'General')}</strong>: ${
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
          <li class="resume-entry">
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
          <li class="resume-entry">
            ${escapeHtml(objAward.award_name || '')}
            ${objAward.issuing_organization ? `- ${escapeHtml(objAward.issuing_organization)}` : ''}
          </li>
        `).join('')}
      </ul>
    </section>
  `;
};

const getCoverLetterForResume = (objState, intResumeId) => {
  const intStateResumeId = Number(objState.intCoverLetterResumeId);
  const blnResumeMatches = Number.isInteger(intStateResumeId)
    && intStateResumeId > 0
    && intStateResumeId === intResumeId;

  const strCoverLetterText = (objState.strCoverLetterText || '').trim();

  if (!blnResumeMatches || !strCoverLetterText) {
    return null;
  }

  return {
    strText: strCoverLetterText,
    strJobTitle: (objState.strCoverLetterJobTitle || '').trim(),
    strCompanyName: (objState.strCoverLetterCompanyName || '').trim()
  };
};

const toCoverLetterParagraphsHtml = (strCoverLetterText) => {
  const arrParagraphs = String(strCoverLetterText || '')
    .split(/\n\s*\n/g)
    .map((strParagraph) => strParagraph.trim())
    .filter((strParagraph) => strParagraph.length > 0);

  return arrParagraphs.map((strParagraph) => {
    const strEscaped = escapeHtml(strParagraph).replace(/\n/g, '<br />');
    return `<p class="cover-letter-block mb-3">${strEscaped}</p>`;
  }).join('');
};

const renderCoverLetterHeaderHtml = ({
  objProfile,
  strDateLabel,
  strJobTitle,
  strCompanyName
}) => {
  const strFullName = `${objProfile?.first_name || ''} ${objProfile?.last_name || ''}`.trim();
  const arrContactParts = buildContactParts(objProfile || {});

  return `
    <div class="cover-letter-block mb-3">
      <p class="mb-0 fw-semibold">${escapeHtml(strFullName || 'Unnamed Candidate')}</p>
      <p class="mb-0">${arrContactParts.map((strPart) => escapeHtml(strPart)).join(' | ')}</p>
    </div>

    <div class="cover-letter-block mb-3">
      <p class="mb-0">${escapeHtml(strDateLabel)}</p>
    </div>

    <div class="cover-letter-block mb-3">
      ${strJobTitle ? `<p class="mb-0"><strong>Position:</strong> ${escapeHtml(strJobTitle)}</p>` : ''}
      ${strCompanyName ? `<p class="mb-0"><strong>Company:</strong> ${escapeHtml(strCompanyName)}</p>` : ''}
    </div>
  `;
};

const renderResumePreviewSection = async (objContext) => {
  const { objState, objElements, showToast, fnRefreshCurrentSection } = objContext;

  ensureAfterPrintCleanup();

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

  const objSelectedResume = (arrResumes || []).find((objResume) => objResume.id === intSelectedResumeId) || null;

  const objCoverLetterData = getCoverLetterForResume(objState, intSelectedResumeId);
  const blnHasCoverLetter = Boolean(objCoverLetterData);

  const strCoverLetterJobTitle = objCoverLetterData?.strJobTitle
    || objPreviewData?.resume?.target_job_title
    || objSelectedResume?.target_job_title
    || '';

  const strCoverLetterCompanyName = objCoverLetterData?.strCompanyName
    || objPreviewData?.resume?.target_company
    || objSelectedResume?.target_company
    || '';

  const strCurrentDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const strResumeOptions = (arrResumes || []).map((objResume) => `
    <option value="${objResume.id}" ${objResume.id === intSelectedResumeId ? 'selected' : ''}>${escapeHtml(objResume.resume_name)}</option>
  `).join('');

  const strResumeDocumentHtml = objPreviewData
    ? `
      <article id="printableResume" class="printable-document resume-document resume-preview-document bg-white border rounded mt-3">
        <header class="resume-document-header p-4 pb-3 text-center">
          ${renderProfileHeaderHtml(objPreviewData.profile)}
        </header>

        <main class="resume-document-body p-4 pt-0">
          ${renderEducationHtml(objPreviewData.education)}
          ${renderExperienceHtml(objPreviewData.experiences)}
          ${renderSkillsHtml(objPreviewData.skillsByCategory)}
          ${renderCertificationsHtml(objPreviewData.certifications)}
          ${renderAwardsHtml(objPreviewData.awards)}
        </main>
      </article>
    `
    : `
      <article id="printableResume" class="printable-document resume-document resume-preview-document bg-white border rounded mt-3 p-4">
        <div class="alert alert-warning mb-0">Unable to render preview for this resume.</div>
      </article>
    `;

  const strCoverLetterDocumentHtml = blnHasCoverLetter
    ? `
      <article id="printableCoverLetter" class="printable-document cover-letter-document bg-white border rounded mt-3 p-4">
        <header class="cover-letter-header mb-3">
          ${renderCoverLetterHeaderHtml({
            objProfile: objPreviewData?.profile || null,
            strDateLabel: strCurrentDate,
            strJobTitle: strCoverLetterJobTitle,
            strCompanyName: strCoverLetterCompanyName
          })}
        </header>

        <main class="cover-letter-body">
          ${toCoverLetterParagraphsHtml(objCoverLetterData.strText)}
        </main>
      </article>
    `
    : `
      <article id="printableCoverLetter" class="printable-document cover-letter-document bg-white border rounded mt-3 p-4">
        <h3 class="h5 mb-2">Cover Letter Preview</h3>
        <p class="text-muted mb-0">
          No cover letter has been generated for this resume yet. Generate one from the Resume Builder or Cover Letter section.
        </p>
      </article>
    `;

  objElements.objViewContainer.innerHTML = `
    <section id="resumePreviewSection">
      <div class="no-print app-controls">
        <h2 class="h4 mb-3">Resume Preview</h2>

        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label for="previewResumeSelector" class="form-label">Choose Resume</label>
            <select id="previewResumeSelector" class="form-select">${strResumeOptions}</select>
          </div>
          <div class="col-md-6 d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline-secondary" id="previewReloadButton">Reload Preview</button>
            <button type="button" class="btn btn-primary" id="previewPrintResumeButton" aria-label="Print resume and save as PDF">Print Resume / Save as PDF</button>
            <button type="button" class="btn btn-outline-primary" id="previewPrintCoverLetterButton" ${blnHasCoverLetter ? '' : 'disabled'} aria-label="Print cover letter and save as PDF">Print Cover Letter / Save as PDF</button>
            <button type="button" class="btn btn-outline-dark" id="previewPrintBothButton" ${blnHasCoverLetter ? '' : 'disabled'} aria-label="Print resume and cover letter and save as PDF">Print Resume + Cover Letter</button>
          </div>
        </div>

        <div class="alert alert-info no-print mt-3 mb-0" role="alert">
          <strong>Clean PDF tip:</strong> In the browser print dialog, choose Save as PDF, then open More settings and turn off Headers and footers so the date, page title, URL, and page number are not printed.
        </div>
      </div>

      ${strResumeDocumentHtml}

      <div class="no-print mt-4">
        <h3 class="h5 mb-1">Cover Letter Preview</h3>
        <p class="text-muted mb-0">Review before printing or submitting.</p>
      </div>

      ${strCoverLetterDocumentHtml}
    </section>
  `;

  const objSelector = document.getElementById('previewResumeSelector');
  const objReloadButton = document.getElementById('previewReloadButton');
  const objPrintResumeButton = document.getElementById('previewPrintResumeButton');
  const objPrintCoverLetterButton = document.getElementById('previewPrintCoverLetterButton');
  const objPrintBothButton = document.getElementById('previewPrintBothButton');

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

  objPrintResumeButton.addEventListener('click', () => {
    runPrintForMode('print-resume');
  });

  objPrintCoverLetterButton.addEventListener('click', () => {
    if (!blnHasCoverLetter) {
      showToast('Generate a cover letter first before printing it.', 'error');
      return;
    }

    runPrintForMode('print-cover-letter');
  });

  objPrintBothButton.addEventListener('click', () => {
    if (!blnHasCoverLetter) {
      showToast('Generate a cover letter first before printing both documents.', 'error');
      return;
    }

    runPrintForMode('print-both');
  });
};

const objResumePreviewModule = {
  strTitle: 'Resume Preview',
  renderSection: renderResumePreviewSection
};

export { objResumePreviewModule };
