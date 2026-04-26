const express = require('express');

const { all, get, run } = require('../../services/database.service');
const { sendError } = require('../../utils/responseHelpers');
const {
  normalizeOptionalString,
  validateRequiredStringField
} = require('../../utils/validators');
const { sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

const parseOptionalCategoryId = (value) => {
  const intCategoryId = Number(value);
  if (!Number.isInteger(intCategoryId) || intCategoryId <= 0) {
    return null;
  }

  return intCategoryId;
};

const parseSortOrder = (value) => {
  const intSortOrder = Number(value);
  return Number.isInteger(intSortOrder) ? intSortOrder : 0;
};

const ensureCategoryExists = async (intCategoryId) => {
  if (intCategoryId === null) {
    return true;
  }

  const objCategory = await get('SELECT id FROM skill_categories WHERE id = ?', [intCategoryId]);
  return Boolean(objCategory);
};

// Skill categories endpoints
router.get('/categories', async (_objRequest, objResponse, fnNext) => {
  try {
    const arrRows = await all('SELECT * FROM skill_categories ORDER BY sort_order ASC, id ASC');
    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/categories/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intCategoryId = Number(objRequest.params.id);
    if (!Number.isInteger(intCategoryId) || intCategoryId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objCategory = await get('SELECT * FROM skill_categories WHERE id = ?', [intCategoryId]);
    if (!objCategory) {
      sendError(objResponse, 404, 'Skill category not found.');
      return;
    }

    objResponse.json(objCategory);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/categories', async (objRequest, objResponse, fnNext) => {
  try {
    const strCategoryError = validateRequiredStringField(objRequest.body || {}, 'category_name');
    if (strCategoryError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strCategoryError] });
      return;
    }

    const strCategoryName = sanitizePlainText(objRequest.body.category_name || '');
    const intSortOrder = parseSortOrder(objRequest.body.sort_order);

    const objInsertResult = await run(
      'INSERT INTO skill_categories (category_name, sort_order) VALUES (?, ?)',
      [strCategoryName, intSortOrder]
    );

    const objCreated = await get('SELECT * FROM skill_categories WHERE id = ?', [objInsertResult.intLastId]);
    objResponse.status(201).json(objCreated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.put('/categories/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intCategoryId = Number(objRequest.params.id);
    if (!Number.isInteger(intCategoryId) || intCategoryId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const strCategoryError = validateRequiredStringField(objRequest.body || {}, 'category_name');
    if (strCategoryError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strCategoryError] });
      return;
    }

    const strCategoryName = sanitizePlainText(objRequest.body.category_name || '');
    const intSortOrder = parseSortOrder(objRequest.body.sort_order);

    const objUpdateResult = await run(
      `UPDATE skill_categories SET
        category_name = ?,
        sort_order = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [strCategoryName, intSortOrder, intCategoryId]
    );

    if (objUpdateResult.intChanges === 0) {
      sendError(objResponse, 404, 'Skill category not found.');
      return;
    }

    const objUpdated = await get('SELECT * FROM skill_categories WHERE id = ?', [intCategoryId]);
    objResponse.json(objUpdated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.delete('/categories/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intCategoryId = Number(objRequest.params.id);
    if (!Number.isInteger(intCategoryId) || intCategoryId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objDeleteResult = await run('DELETE FROM skill_categories WHERE id = ?', [intCategoryId]);
    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Skill category not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

// Skills endpoints
router.get('/', async (_objRequest, objResponse, fnNext) => {
  try {
    const arrRows = await all(
      `SELECT
        skills.*,
        skill_categories.category_name
      FROM skills
      LEFT JOIN skill_categories ON skills.skill_category_id = skill_categories.id
      ORDER BY skills.sort_order ASC, skills.id ASC`
    );

    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intSkillId = Number(objRequest.params.id);
    if (!Number.isInteger(intSkillId) || intSkillId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objSkill = await get('SELECT * FROM skills WHERE id = ?', [intSkillId]);
    if (!objSkill) {
      sendError(objResponse, 404, 'Skill not found.');
      return;
    }

    objResponse.json(objSkill);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/', async (objRequest, objResponse, fnNext) => {
  try {
    const strSkillNameError = validateRequiredStringField(objRequest.body || {}, 'skill_name');
    if (strSkillNameError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strSkillNameError] });
      return;
    }

    const strSkillName = sanitizePlainText(objRequest.body.skill_name || '');
    const intCategoryId = parseOptionalCategoryId(objRequest.body.skill_category_id);
    const intSortOrder = parseSortOrder(objRequest.body.sort_order);

    const blnCategoryExists = await ensureCategoryExists(intCategoryId);
    if (!blnCategoryExists) {
      sendError(objResponse, 400, 'skill_category_id does not match an existing category.');
      return;
    }

    const objInsertResult = await run(
      'INSERT INTO skills (skill_category_id, skill_name, sort_order) VALUES (?, ?, ?)',
      [intCategoryId, strSkillName, intSortOrder]
    );

    const objCreated = await get('SELECT * FROM skills WHERE id = ?', [objInsertResult.intLastId]);
    objResponse.status(201).json(objCreated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.put('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intSkillId = Number(objRequest.params.id);
    if (!Number.isInteger(intSkillId) || intSkillId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const strSkillNameError = validateRequiredStringField(objRequest.body || {}, 'skill_name');
    if (strSkillNameError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strSkillNameError] });
      return;
    }

    const strSkillName = sanitizePlainText(objRequest.body.skill_name || '');
    const intCategoryId = parseOptionalCategoryId(objRequest.body.skill_category_id);
    const intSortOrder = parseSortOrder(objRequest.body.sort_order);

    const blnCategoryExists = await ensureCategoryExists(intCategoryId);
    if (!blnCategoryExists) {
      sendError(objResponse, 400, 'skill_category_id does not match an existing category.');
      return;
    }

    const objUpdateResult = await run(
      `UPDATE skills SET
        skill_category_id = ?,
        skill_name = ?,
        sort_order = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [intCategoryId, strSkillName, intSortOrder, intSkillId]
    );

    if (objUpdateResult.intChanges === 0) {
      sendError(objResponse, 404, 'Skill not found.');
      return;
    }

    const objUpdated = await get('SELECT * FROM skills WHERE id = ?', [intSkillId]);
    objResponse.json(objUpdated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.delete('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intSkillId = Number(objRequest.params.id);
    if (!Number.isInteger(intSkillId) || intSkillId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objDeleteResult = await run('DELETE FROM skills WHERE id = ?', [intSkillId]);
    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Skill not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

module.exports = router;
