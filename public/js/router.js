import { byId } from './utils/dom.js';
import { announceMessage, focusViewTitle } from './utils/accessibility.js';

import { objDashboardModule, objAboutModule } from './modules/dashboard.js';
import { objProfileModule } from './modules/profile.js';
import { objEducationModule } from './modules/education.js';
import { objExperienceModule } from './modules/experience.js';
import { objSkillsModule } from './modules/skills.js';
import { objCertificationsModule } from './modules/certifications.js';
import { objAwardsModule } from './modules/awards.js';
import { objResumeBuilderModule } from './modules/resumeBuilder.js';
import { objResumePreviewModule } from './modules/resumePreview.js';
import { objSettingsModule } from './modules/settings.js';

const objSectionModules = {
  dashboard: objDashboardModule,
  profile: objProfileModule,
  education: objEducationModule,
  experience: objExperienceModule,
  skills: objSkillsModule,
  certifications: objCertificationsModule,
  awards: objAwardsModule,
  'resume-builder': objResumeBuilderModule,
  'resume-preview': objResumePreviewModule,
  settings: objSettingsModule,
  about: objAboutModule
};

const getSectionFromHash = () => {
  const strHashValue = window.location.hash.replace('#', '').trim().toLowerCase();

  if (!strHashValue || !objSectionModules[strHashValue]) {
    return 'dashboard';
  }

  return strHashValue;
};

const setActiveNavigationItem = (strCurrentSection) => {
  const arrLinks = Array.from(document.querySelectorAll('#mainNavLinks .nav-link'));

  arrLinks.forEach((objLink) => {
    const blnIsActive = objLink.getAttribute('data-section') === strCurrentSection;
    objLink.classList.toggle('active', blnIsActive);
    objLink.setAttribute('aria-current', blnIsActive ? 'page' : 'false');
  });
};

const initializeRouter = (objContext) => {
  const { objState, objElements, showToast } = objContext;

  const renderSection = async () => {
    const strTargetSection = getSectionFromHash();
    const objModule = objSectionModules[strTargetSection] || objDashboardModule;

    objState.strCurrentSection = strTargetSection;
    setActiveNavigationItem(strTargetSection);

    objElements.objViewContainer.setAttribute('aria-busy', 'true');
    objElements.objViewTitle.textContent = objModule.strTitle;

    const objModuleContext = {
      ...objContext,
      fnNavigate: (strSection) => {
        window.location.hash = `#${strSection}`;
      },
      fnRefreshCurrentSection: renderSection
    };

    try {
      await objModule.renderSection(objModuleContext);
      announceMessage(`${objModule.strTitle} section loaded.`);
    } catch (objError) {
      console.error('Section render error:', objError);
      objElements.objViewContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Unable to render this section. Please try again.
        </div>
      `;
      showToast('Unable to render the selected section.', 'error');
    } finally {
      objElements.objViewContainer.setAttribute('aria-busy', 'false');
      focusViewTitle();
    }
  };

  window.addEventListener('hashchange', renderSection);

  if (!window.location.hash) {
    window.location.hash = '#dashboard';
  } else {
    renderSection();
  }
};

export { initializeRouter };
