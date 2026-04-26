import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { escapeHtml, toDisplayValue } from '../utils/dom.js';

const buildCategoryPayload = (objFormData) => {
  return {
    category_name: objFormData.get('category_name')?.trim() || '',
    sort_order: Number(objFormData.get('sort_order')) || 0
  };
};

const buildSkillPayload = (objFormData) => {
  const intCategoryId = Number(objFormData.get('skill_category_id'));

  return {
    skill_name: objFormData.get('skill_name')?.trim() || '',
    skill_category_id: Number.isInteger(intCategoryId) && intCategoryId > 0 ? intCategoryId : null,
    sort_order: Number(objFormData.get('sort_order')) || 0
  };
};

const renderSkillsSection = async (objContext) => {
  const { objState, objElements, showToast, confirmDialog, fnRefreshCurrentSection } = objContext;

  let arrCategories = [];
  let arrSkills = [];

  try {
    [arrCategories, arrSkills] = await Promise.all([
      apiGet('/skills/categories'),
      apiGet('/skills')
    ]);
  } catch (objError) {
    showToast(`Unable to load skills data: ${objError.message}`, 'error');
  }

  const objEditingCategory = arrCategories.find((objItem) => objItem.id === objState.intEditingSkillCategoryId) || null;
  const objEditingSkill = arrSkills.find((objItem) => objItem.id === objState.intEditingSkillId) || null;

  const strCategoryRows = arrCategories.length === 0
    ? '<tr><td colspan="3" class="text-center text-muted">No categories yet.</td></tr>'
    : arrCategories.map((objCategory) => `
      <tr>
        <td>${toDisplayValue(objCategory.category_name)}</td>
        <td>${toDisplayValue(objCategory.sort_order)}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-primary" data-category-action="edit" data-id="${objCategory.id}">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-category-action="delete" data-id="${objCategory.id}">Delete</button>
        </td>
      </tr>
    `).join('');

  const strSkillRows = arrSkills.length === 0
    ? '<tr><td colspan="4" class="text-center text-muted">No skills yet.</td></tr>'
    : arrSkills.map((objSkill) => `
      <tr>
        <td>${toDisplayValue(objSkill.skill_name)}</td>
        <td>${toDisplayValue(objSkill.category_name)}</td>
        <td>${toDisplayValue(objSkill.sort_order)}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-primary" data-skill-action="edit" data-id="${objSkill.id}">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-skill-action="delete" data-id="${objSkill.id}">Delete</button>
        </td>
      </tr>
    `).join('');

  const strCategoryOptions = ['<option value="">No Category</option>']
    .concat(arrCategories.map((objCategory) => `
      <option value="${objCategory.id}" ${objEditingSkill?.skill_category_id === objCategory.id ? 'selected' : ''}>
        ${escapeHtml(objCategory.category_name)}
      </option>
    `))
    .join('');

  objElements.objViewContainer.innerHTML = `
    <div class="section-card p-4">
      <h2 class="h4 mb-3">Skills</h2>

      <div class="row g-4">
        <div class="col-lg-5">
          <h3 class="h5">Skill Categories</h3>
          <form id="skillCategoryForm" class="mb-3" novalidate>
            <input type="hidden" name="id" value="${objEditingCategory?.id || ''}" />
            <div class="mb-2">
              <label for="categoryName" class="form-label">Category Name <span aria-hidden="true">*</span></label>
              <input id="categoryName" name="category_name" class="form-control" required value="${escapeHtml(objEditingCategory?.category_name || '')}" />
            </div>
            <div class="mb-2">
              <label for="categorySortOrder" class="form-label">Sort Order</label>
              <input id="categorySortOrder" name="sort_order" class="form-control" type="number" value="${escapeHtml(String(objEditingCategory?.sort_order ?? 0))}" />
            </div>
            <div class="alert alert-danger d-none" data-category-error></div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary btn-sm">${objEditingCategory ? 'Update' : 'Add'} Category</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" id="categoryResetButton">Reset</button>
            </div>
          </form>

          <div class="table-responsive">
            <table class="table table-striped align-middle">
              <thead><tr><th>Category</th><th>Sort</th><th class="text-end">Actions</th></tr></thead>
              <tbody id="categoryTableBody">${strCategoryRows}</tbody>
            </table>
          </div>
        </div>

        <div class="col-lg-7">
          <h3 class="h5">Skills</h3>
          <form id="skillForm" class="mb-3" novalidate>
            <input type="hidden" name="id" value="${objEditingSkill?.id || ''}" />
            <div class="row g-2">
              <div class="col-md-6">
                <label for="skillName" class="form-label">Skill Name <span aria-hidden="true">*</span></label>
                <input id="skillName" name="skill_name" class="form-control" required value="${escapeHtml(objEditingSkill?.skill_name || '')}" />
              </div>
              <div class="col-md-4">
                <label for="skillCategory" class="form-label">Category</label>
                <select id="skillCategory" name="skill_category_id" class="form-select">${strCategoryOptions}</select>
              </div>
              <div class="col-md-2">
                <label for="skillSortOrder" class="form-label">Sort</label>
                <input id="skillSortOrder" name="sort_order" class="form-control" type="number" value="${escapeHtml(String(objEditingSkill?.sort_order ?? 0))}" />
              </div>
            </div>
            <div class="alert alert-danger d-none mt-2" data-skill-error></div>
            <div class="d-flex gap-2 mt-2">
              <button type="submit" class="btn btn-primary btn-sm">${objEditingSkill ? 'Update' : 'Add'} Skill</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" id="skillResetButton">Reset</button>
            </div>
          </form>

          <div class="table-responsive">
            <table class="table table-striped align-middle">
              <thead><tr><th>Skill</th><th>Category</th><th>Sort</th><th class="text-end">Actions</th></tr></thead>
              <tbody id="skillTableBody">${strSkillRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  const objCategoryForm = document.getElementById('skillCategoryForm');
  const objSkillForm = document.getElementById('skillForm');
  const objCategoryTableBody = document.getElementById('categoryTableBody');
  const objSkillTableBody = document.getElementById('skillTableBody');

  const setCategoryError = (strMessage = '') => {
    const objError = objCategoryForm.querySelector('[data-category-error]');
    objError.textContent = strMessage;
    objError.classList.toggle('d-none', !strMessage);
  };

  const setSkillError = (strMessage = '') => {
    const objError = objSkillForm.querySelector('[data-skill-error]');
    objError.textContent = strMessage;
    objError.classList.toggle('d-none', !strMessage);
  };

  objCategoryForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setCategoryError('');

    const objFormData = new FormData(objCategoryForm);
    const objPayload = buildCategoryPayload(objFormData);

    if (!objPayload.category_name) {
      setCategoryError('Category name is required.');
      return;
    }

    try {
      const intId = Number(objFormData.get('id'));
      if (Number.isInteger(intId) && intId > 0) {
        await apiPut(`/skills/categories/${intId}`, objPayload);
        showToast('Category updated.');
      } else {
        await apiPost('/skills/categories', objPayload);
        showToast('Category added.');
      }

      objState.intEditingSkillCategoryId = null;
      await fnRefreshCurrentSection();
    } catch (objError) {
      setCategoryError(objError.message || 'Unable to save category.');
      showToast(objError.message || 'Unable to save category.', 'error');
    }
  });

  objSkillForm.addEventListener('submit', async (objEvent) => {
    objEvent.preventDefault();
    setSkillError('');

    const objFormData = new FormData(objSkillForm);
    const objPayload = buildSkillPayload(objFormData);

    if (!objPayload.skill_name) {
      setSkillError('Skill name is required.');
      return;
    }

    try {
      const intId = Number(objFormData.get('id'));
      if (Number.isInteger(intId) && intId > 0) {
        await apiPut(`/skills/${intId}`, objPayload);
        showToast('Skill updated.');
      } else {
        await apiPost('/skills', objPayload);
        showToast('Skill added.');
      }

      objState.intEditingSkillId = null;
      await fnRefreshCurrentSection();
    } catch (objError) {
      setSkillError(objError.message || 'Unable to save skill.');
      showToast(objError.message || 'Unable to save skill.', 'error');
    }
  });

  document.getElementById('categoryResetButton').addEventListener('click', async () => {
    objState.intEditingSkillCategoryId = null;
    await fnRefreshCurrentSection();
  });

  document.getElementById('skillResetButton').addEventListener('click', async () => {
    objState.intEditingSkillId = null;
    await fnRefreshCurrentSection();
  });

  objCategoryTableBody.addEventListener('click', async (objEvent) => {
    const objButton = objEvent.target.closest('button[data-category-action]');
    if (!objButton) {
      return;
    }

    const intId = Number(objButton.getAttribute('data-id'));
    const strAction = objButton.getAttribute('data-category-action');

    if (strAction === 'edit') {
      objState.intEditingSkillCategoryId = intId;
      await fnRefreshCurrentSection();
      return;
    }

    if (strAction === 'delete') {
      const blnConfirmed = await confirmDialog('Delete this category? Skills will keep working but category will be removed.', 'Delete Category');
      if (!blnConfirmed) {
        return;
      }

      try {
        await apiDelete(`/skills/categories/${intId}`);
        if (objState.intEditingSkillCategoryId === intId) {
          objState.intEditingSkillCategoryId = null;
        }
        showToast('Category deleted.');
        await fnRefreshCurrentSection();
      } catch (objError) {
        showToast(objError.message || 'Unable to delete category.', 'error');
      }
    }
  });

  objSkillTableBody.addEventListener('click', async (objEvent) => {
    const objButton = objEvent.target.closest('button[data-skill-action]');
    if (!objButton) {
      return;
    }

    const intId = Number(objButton.getAttribute('data-id'));
    const strAction = objButton.getAttribute('data-skill-action');

    if (strAction === 'edit') {
      objState.intEditingSkillId = intId;
      await fnRefreshCurrentSection();
      return;
    }

    if (strAction === 'delete') {
      const blnConfirmed = await confirmDialog('Delete this skill?', 'Delete Skill');
      if (!blnConfirmed) {
        return;
      }

      try {
        await apiDelete(`/skills/${intId}`);
        if (objState.intEditingSkillId === intId) {
          objState.intEditingSkillId = null;
        }
        showToast('Skill deleted.');
        await fnRefreshCurrentSection();
      } catch (objError) {
        showToast(objError.message || 'Unable to delete skill.', 'error');
      }
    }
  });
};

const objSkillsModule = {
  strTitle: 'Skills',
  renderSection: renderSkillsSection
};

export { objSkillsModule };
