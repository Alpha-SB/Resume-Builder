const renderDashboardSection = async (objContext) => {
  const { objElements } = objContext;

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <h2 class="h4">Welcome to Resume Builder</h2>
      <p class="mb-3">
        Build and manage your profile, education, experience, and reusable resume content in one place.
      </p>

      <div class="alert alert-info" role="status">
        Complete your profile and experience first, then use Resume Builder and Resume Preview sections.
      </div>

      <div class="d-flex flex-wrap gap-2">
        <a class="btn btn-primary" href="#profile">Go to Profile</a>
        <a class="btn btn-outline-primary" href="#experience">Go to Experience</a>
        <a class="btn btn-outline-primary" href="#resume-builder">Go to Resume Builder</a>
        <a class="btn btn-outline-primary" href="#resume-preview">Go to Resume Preview</a>
      </div>
    </div>
  `;
};

const renderAboutSection = async (objContext) => {
  const { objElements } = objContext;

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <h2 class="h4">About and Attributions</h2>
      <p>This project uses local libraries and tools only. No CDN links are used.</p>

      <div class="table-responsive">
        <table class="table table-striped align-middle">
          <thead>
            <tr>
              <th>Dependency</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Bootstrap</td><td>Responsive layout and UI components</td></tr>
            <tr><td>Bootswatch (Litera)</td><td>Theme styling</td></tr>
            <tr><td>Bootstrap Icons</td><td>Icon set</td></tr>
            <tr><td>Quill</td><td>Optional rich text usage</td></tr>
            <tr><td>Express</td><td>Backend API server</td></tr>
            <tr><td>SQLite</td><td>Local database storage</td></tr>
            <tr><td>Google Gemini API</td><td>AI suggestions for resume bullet improvement</td></tr>
            <tr><td>dotenv, helmet, cors, validator, sanitize-html</td><td>Configuration, security headers, validation, and sanitization</td></tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 mb-0">
        Detailed attribution notes are also tracked in <code>docs/third-party-attributions.md</code>.
      </p>
    </div>
  `;
};

const objDashboardModule = {
  strTitle: 'Dashboard',
  renderSection: renderDashboardSection
};

const objAboutModule = {
  strTitle: 'About / Attributions',
  renderSection: renderAboutSection
};

export {
  objDashboardModule,
  objAboutModule
};
