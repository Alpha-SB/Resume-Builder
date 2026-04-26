const express = require('express');

const { all, get, run } = require('../../services/database.service');
const { sendError } = require('../../utils/responseHelpers');
const {
  normalizeOptionalString,
  validateRequiredStringField
} = require('../../utils/validators');
const { sanitizeRichText, sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

const normalizeCurrentFlag = (value) => {
  // Accept multiple "true-like" values because form payloads can arrive
  // as booleans, numbers, or strings depending on the client code.
  const arrTrueValues = [true, 1, '1', 'true', 'yes', 'on'];
  return arrTrueValues.includes(value) ? 1 : 0;
};

const buildExperienceValues = (objBody) => {
  return {
    job_title: sanitizePlainText(objBody.job_title || ''),
    company_name: sanitizePlainText(objBody.company_name || ''),
    location: normalizeOptionalString(sanitizePlainText(objBody.location || '')),
    start_date: normalizeOptionalString(sanitizePlainText(objBody.start_date || '')),
    end_date: normalizeOptionalString(sanitizePlainText(objBody.end_date || '')),
    is_current: normalizeCurrentFlag(objBody.is_current),
    description: normalizeOptionalString(sanitizeRichText(objBody.description || ''))
  };
};

const buildBulletValues = (objBody) => {
  return {
    experience_id: Number(objBody.experience_id),
    bullet_text: sanitizePlainText(objBody.bullet_text || ''),
    sort_order: Number.isInteger(Number(objBody.sort_order)) ? Number(objBody.sort_order) : 0,
    ai_last_reviewed_at: normalizeOptionalString(sanitizePlainText(objBody.ai_last_reviewed_at || ''))
  };
};

router.get('/', async (_objRequest, objResponse, fnNext) => {
  try {
    const arrRows = await all('SELECT * FROM experiences ORDER BY id DESC');
    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/', async (objRequest, objResponse, fnNext) => {
  try {
    const arrErrors = [];

    const strJobTitleError = validateRequiredStringField(objRequest.body || {}, 'job_title');
    const strCompanyNameError = validateRequiredStringField(objRequest.body || {}, 'company_name');

    [strJobTitleError, strCompanyNameError].forEach((strError) => {
      if (strError) {
        arrErrors.push(strError);
      }
    });

    if (arrErrors.length > 0) {
      sendError(objResponse, 400, 'Validation failed.', { errors: arrErrors });
      return;
    }

    const objValues = buildExperienceValues(objRequest.body || {});

    const objInsertResult = await run(
      `INSERT INTO experiences (
        job_title,
        company_name,
        location,
        start_date,
        end_date,
        is_current,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        objValues.job_title,
        objValues.company_name,
        objValues.location,
        objValues.start_date,
        objValues.end_date,
        objValues.is_current,
        objValues.description
      ]
    );

    const objCreated = await get('SELECT * FROM experiences WHERE id = ?', [objInsertResult.intLastId]);
    objResponse.status(201).json(objCreated);
  } catch (objError) {
    fnNext(objError);
  }
});

// Experience bullets CRUD routes
router.get('/bullets', async (objRequest, objResponse, fnNext) => {
  try {
    const intExperienceId = Number(objRequest.query.experience_id);

    let arrRows = [];
    if (Number.isInteger(intExperienceId) && intExperienceId > 0) {
      arrRows = await all(
        'SELECT * FROM experience_bullets WHERE experience_id = ? ORDER BY sort_order ASC, id ASC',
        [intExperienceId]
      );
    } else {
      arrRows = await all(
        'SELECT * FROM experience_bullets ORDER BY experience_id ASC, sort_order ASC, id ASC'
      );
    }

    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/:experienceId/bullets', async (objRequest, objResponse, fnNext) => {
  try {
    const intExperienceId = Number(objRequest.params.experienceId);

    if (!Number.isInteger(intExperienceId) || intExperienceId <= 0) {
      sendError(objResponse, 400, 'experienceId must be a positive integer.');
      return;
    }

    const arrRows = await all(
      'SELECT * FROM experience_bullets WHERE experience_id = ? ORDER BY sort_order ASC, id ASC',
      [intExperienceId]
    );

    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/bullets/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intBulletId = Number(objRequest.params.id);

    if (!Number.isInteger(intBulletId) || intBulletId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objRow = await get('SELECT * FROM experience_bullets WHERE id = ?', [intBulletId]);

    if (!objRow) {
      sendError(objResponse, 404, 'Experience bullet not found.');
      return;
    }

    objResponse.json(objRow);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/bullets', async (objRequest, objResponse, fnNext) => {
  try {
    const arrErrors = [];

    const strExperienceIdError =
      !Number.isInteger(Number(objRequest.body?.experience_id)) || Number(objRequest.body.experience_id) <= 0
        ? 'experience_id is required and must be a positive integer.'
        : null;

    const strBulletTextError = validateRequiredStringField(objRequest.body || {}, 'bullet_text', 500);

    [strExperienceIdError, strBulletTextError].forEach((strError) => {
      if (strError) {
        arrErrors.push(strError);
      }
    });

    if (arrErrors.length > 0) {
      sendError(objResponse, 400, 'Validation failed.', { errors: arrErrors });
      return;
    }

    const objValues = buildBulletValues(objRequest.body || {});

    const objExperienceRow = await get('SELECT id FROM experiences WHERE id = ?', [objValues.experience_id]);
    if (!objExperienceRow) {
      sendError(objResponse, 400, 'experience_id does not match an existing experience.');
      return;
    }

    const objInsertResult = await run(
      `INSERT INTO experience_bullets (
        experience_id,
        bullet_text,
        sort_order,
        ai_last_reviewed_at
      ) VALUES (?, ?, ?, ?)`,
      [
        objValues.experience_id,
        objValues.bullet_text,
        objValues.sort_order,
        objValues.ai_last_reviewed_at
      ]
    );

    const objCreated = await get('SELECT * FROM experience_bullets WHERE id = ?', [objInsertResult.intLastId]);
    objResponse.status(201).json(objCreated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.put('/bullets/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intBulletId = Number(objRequest.params.id);

    if (!Number.isInteger(intBulletId) || intBulletId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const arrErrors = [];

    const strExperienceIdError =
      !Number.isInteger(Number(objRequest.body?.experience_id)) || Number(objRequest.body.experience_id) <= 0
        ? 'experience_id is required and must be a positive integer.'
        : null;

    const strBulletTextError = validateRequiredStringField(objRequest.body || {}, 'bullet_text', 500);

    [strExperienceIdError, strBulletTextError].forEach((strError) => {
      if (strError) {
        arrErrors.push(strError);
      }
    });

    if (arrErrors.length > 0) {
      sendError(objResponse, 400, 'Validation failed.', { errors: arrErrors });
      return;
    }

    const objValues = buildBulletValues(objRequest.body || {});

    const objExperienceRow = await get('SELECT id FROM experiences WHERE id = ?', [objValues.experience_id]);
    if (!objExperienceRow) {
      sendError(objResponse, 400, 'experience_id does not match an existing experience.');
      return;
    }

    const objUpdateResult = await run(
      `UPDATE experience_bullets SET
        experience_id = ?,
        bullet_text = ?,
        sort_order = ?,
        ai_last_reviewed_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        objValues.experience_id,
        objValues.bullet_text,
        objValues.sort_order,
        objValues.ai_last_reviewed_at,
        intBulletId
      ]
    );

    if (objUpdateResult.intChanges === 0) {
      sendError(objResponse, 404, 'Experience bullet not found.');
      return;
    }

    const objUpdated = await get('SELECT * FROM experience_bullets WHERE id = ?', [intBulletId]);
    objResponse.json(objUpdated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.delete('/bullets/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intBulletId = Number(objRequest.params.id);

    if (!Number.isInteger(intBulletId) || intBulletId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objDeleteResult = await run('DELETE FROM experience_bullets WHERE id = ?', [intBulletId]);

    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Experience bullet not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intExperienceId = Number(objRequest.params.id);

    if (!Number.isInteger(intExperienceId) || intExperienceId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objRow = await get('SELECT * FROM experiences WHERE id = ?', [intExperienceId]);

    if (!objRow) {
      sendError(objResponse, 404, 'Experience record not found.');
      return;
    }

    objResponse.json(objRow);
  } catch (objError) {
    fnNext(objError);
  }
});

router.put('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intExperienceId = Number(objRequest.params.id);

    if (!Number.isInteger(intExperienceId) || intExperienceId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const arrErrors = [];

    const strJobTitleError = validateRequiredStringField(objRequest.body || {}, 'job_title');
    const strCompanyNameError = validateRequiredStringField(objRequest.body || {}, 'company_name');

    [strJobTitleError, strCompanyNameError].forEach((strError) => {
      if (strError) {
        arrErrors.push(strError);
      }
    });

    if (arrErrors.length > 0) {
      sendError(objResponse, 400, 'Validation failed.', { errors: arrErrors });
      return;
    }

    const objValues = buildExperienceValues(objRequest.body || {});

    const objUpdateResult = await run(
      `UPDATE experiences SET
        job_title = ?,
        company_name = ?,
        location = ?,
        start_date = ?,
        end_date = ?,
        is_current = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        objValues.job_title,
        objValues.company_name,
        objValues.location,
        objValues.start_date,
        objValues.end_date,
        objValues.is_current,
        objValues.description,
        intExperienceId
      ]
    );

    if (objUpdateResult.intChanges === 0) {
      sendError(objResponse, 404, 'Experience record not found.');
      return;
    }

    const objUpdated = await get('SELECT * FROM experiences WHERE id = ?', [intExperienceId]);
    objResponse.json(objUpdated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.delete('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intExperienceId = Number(objRequest.params.id);

    if (!Number.isInteger(intExperienceId) || intExperienceId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objDeleteResult = await run('DELETE FROM experiences WHERE id = ?', [intExperienceId]);

    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Experience record not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

module.exports = router;
