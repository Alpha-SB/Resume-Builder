import { apiGet, apiPost, apiPut } from '../api.js';
import { escapeHtml } from '../utils/dom.js';

const buildProfilePayload = (objFormData) => {
  return {
    first_name: objFormData.get('first_name')?.trim() || '',
    last_name: objFormData.get('last_name')?.trim() || '',
    email: objFormData.get('email')?.trim() || '',
    phone: objFormData.get('phone')?.trim() || '',
    city: objFormData.get('city')?.trim() || '',
    state: objFormData.get('state')?.trim() || '',
    linkedin_url: objFormData.get('linkedin_url')?.trim() || '',
    github_url: objFormData.get('github_url')?.trim() || '',
    portfolio_url: objFormData.get('portfolio_url')?.trim() || '',
    professional_summary: objFormData.get('professional_summary')?.trim() || ''
  };
};

const setValidationFeedback = (objForm, strMessage = '') => {
  const objErrorBox = objForm.querySelector('[data-profile-error]');
  if (objErrorBox) {
    objErrorBox.textContent = strMessage;
    objErrorBox.classList.toggle('d-none', !strMessage);
  }
};

const renderProfileSection = async (objContext) => {
  const { objElements, showToast, fnRefreshCurrentSection } = objContext;

  let arrProfiles = [];
  try {
    arrProfiles = await apiGet('/profile');
  } catch (objError) {
    showToast(`Unable to load profile: ${objError.message}`, 'error');
  }

  const objCurrentProfile = Array.isArray(arrProfiles) && arrProfiles.length > 0 ? arrProfiles[0] : null;

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h4 mb-0">Profile</h2>
        <span class="badge text-bg-secondary">${objCurrentProfile ? 'Existing Profile Loaded' : 'No Profile Yet'}</span>
      </div>

      <form id="profileForm" novalidate>
        <input type="hidden" name="id" value="${objCurrentProfile?.id || ''}" />

        <div class="row g-3">
          <div class="col-md-6">
            <label for="profileFirstName" class="form-label">First Name <span aria-hidden="true">*</span></label>
            <input type="text" class="form-control" id="profileFirstName" name="first_name" required maxlength="255" value="${escapeHtml(objCurrentProfile?.first_name || '')}" />
          </div>
          <div class="col-md-6">
            <label for="profileLastName" class="form-label">Last Name <span aria-hidden="true">*</span></label>
            <input type="text" class="form-control" id="profileLastName" name="last_name" required maxlength="255" value="${escapeHtml(objCurrentProfile?.last_name || '')}" />
          </div>
          <div class="col-md-6">
            <label for="profileEmail" class="form-label">Email</label>
            <input type="email" class="form-control" id="profileEmail" name="email" value="${escapeHtml(objCurrentProfile?.email || '')}" />
          </div>
          <div class="col-md-6">
            <label for="profilePhone" class="form-label">Phone</label>
            <input type="text" class="form-control" id="profilePhone" name="phone" value="${escapeHtml(objCurrentProfile?.phone || '')}" />
          </div>
          <div class="col-md-6">
            <label for="profileCity" class="form-label">City</label>
            <input type="text" class="form-control" id="profileCity" name="city" value="${escapeHtml(objCurrentProfile?.city || '')}" />
          </div>
          <div class="col-md-6">
            <label for="profileState" class="form-label">State</label>
            <input type="text" class="form-control" id="profileState" name="state" value="${escapeHtml(objCurrentProfile?.state || '')}" />
          </div>
          <div class="col-md-4">
            <label for="profileLinkedIn" class="form-label">LinkedIn URL</label>
            <input type="url" class="form-control" id="profileLinkedIn" name="linkedin_url" value="${escapeHtml(objCurrentProfile?.linkedin_url || '')}" />
          </div>
          <div class="col-md-4">
            <label for="profileGitHub" class="form-label">GitHub URL</label>
            <input type="url" class="form-control" id="profileGitHub" name="github_url" value="${escapeHtml(objCurrentProfile?.github_url || '')}" />
          </div>
          <div class="col-md-4">
            <label for="profilePortfolio" class="form-label">Portfolio URL</label>
            <input type="url" class="form-control" id="profilePortfolio" name="portfolio_url" value="${escapeHtml(objCurrentProfile?.portfolio_url || '')}" />
          </div>
          <div class="col-12">
            <label for="profileSummary" class="form-label">Professional Summary</label>
            <textarea class="form-control" id="profileSummary" name="professional_summary" rows="4">${escapeHtml(objCurrentProfile?.professional_summary || '')}</textarea>
          </div>
        </div>

        <div class="alert alert-danger mt-3 d-none" data-profile-error role="alert"></div>

        <div class="mt-3 d-flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary">Save Profile</button>
          <button type="button" class="btn btn-outline-secondary" id="profileReloadButton">Reload Latest</button>
        </div>
      </form>
    </div>
  `;

  const objForm = document.getElementById('profileForm');
  const objReloadButton = document.getElementById('profileReloadButton');

  objReloadButton.addEventListener('click', () => {
    fnRefreshCurrentSection();
  });

  objForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setValidationFeedback(objForm, '');

    const objFormData = new FormData(objForm);
    const objPayload = buildProfilePayload(objFormData);

    if (!objPayload.first_name || !objPayload.last_name) {
      setValidationFeedback(objForm, 'First name and last name are required.');
      return;
    }

    try {
      const intProfileId = Number(objFormData.get('id'));

      if (Number.isInteger(intProfileId) && intProfileId > 0) {
        await apiPut(`/profile/${intProfileId}`, objPayload);
      } else {
        await apiPost('/profile', objPayload);
      }

      showToast('Profile saved successfully.');
      await fnRefreshCurrentSection();
    } catch (objError) {
      setValidationFeedback(objForm, objError.message || 'Unable to save profile.');
      showToast(objError.message || 'Unable to save profile.', 'error');
    }
  });
};

const objProfileModule = {
  strTitle: 'Profile',
  renderSection: renderProfileSection
};

export { objProfileModule };
