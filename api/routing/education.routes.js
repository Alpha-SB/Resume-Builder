const express = require('express');

const { all, get, run } = require('../../services/database.service');
const { sendError } = require('../../utils/responseHelpers');
const {
  normalizeOptionalString,
  validateRequiredStringField
} = require('../../utils/validators');
const { sanitizeRichText, sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

const buildEducationValues = (objBody) => {
  return {
    school_name: sanitizePlainText(objBody.school_name || ''),
    degree: normalizeOptionalString(sanitizePlainText(objBody.degree || '')),
    major: normalizeOptionalString(sanitizePlainText(objBody.major || '')),
    location: normalizeOptionalString(sanitizePlainText(objBody.location || '')),
    start_date: normalizeOptionalString(sanitizePlainText(objBody.start_date || '')),
    end_date: normalizeOptionalString(sanitizePlainText(objBody.end_date || '')),
    gpa: normalizeOptionalString(sanitizePlainText(objBody.gpa || '')),
    details: normalizeOptionalString(sanitizeRichText(objBody.details || ''))
  };
};

router.get('/', async (_objRequest, objResponse, fnNext) => {
  try {
    const arrRows = await all('SELECT * FROM education ORDER BY id DESC');
    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intEducationId = Number(objRequest.params.id);

    if (!Number.isInteger(intEducationId) || intEducationId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objRow = await get('SELECT * FROM education WHERE id = ?', [intEducationId]);

    if (!objRow) {
      sendError(objResponse, 404, 'Education record not found.');
      return;
    }

    objResponse.json(objRow);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/', async (objRequest, objResponse, fnNext) => {
  try {
    const strSchoolNameError = validateRequiredStringField(objRequest.body || {}, 'school_name');

    if (strSchoolNameError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strSchoolNameError] });
      return;
    }

    const objValues = buildEducationValues(objRequest.body || {});

    const objInsertResult = await run(
      `INSERT INTO education (
        school_name,
        degree,
        major,
        location,
        start_date,
        end_date,
        gpa,
        details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        objValues.school_name,
        objValues.degree,
        objValues.major,
        objValues.location,
        objValues.start_date,
        objValues.end_date,
        objValues.gpa,
        objValues.details
      ]
    );

    const objCreated = await get('SELECT * FROM education WHERE id = ?', [objInsertResult.intLastId]);
    objResponse.status(201).json(objCreated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.put('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intEducationId = Number(objRequest.params.id);

    if (!Number.isInteger(intEducationId) || intEducationId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const strSchoolNameError = validateRequiredStringField(objRequest.body || {}, 'school_name');

    if (strSchoolNameError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strSchoolNameError] });
      return;
    }

    const objValues = buildEducationValues(objRequest.body || {});

    const objUpdateResult = await run(
      `UPDATE education SET
        school_name = ?,
        degree = ?,
        major = ?,
        location = ?,
        start_date = ?,
        end_date = ?,
        gpa = ?,
        details = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        objValues.school_name,
        objValues.degree,
        objValues.major,
        objValues.location,
        objValues.start_date,
        objValues.end_date,
        objValues.gpa,
        objValues.details,
        intEducationId
      ]
    );

    if (objUpdateResult.intChanges === 0) {
      sendError(objResponse, 404, 'Education record not found.');
      return;
    }

    const objUpdated = await get('SELECT * FROM education WHERE id = ?', [intEducationId]);
    objResponse.json(objUpdated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.delete('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intEducationId = Number(objRequest.params.id);

    if (!Number.isInteger(intEducationId) || intEducationId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objDeleteResult = await run('DELETE FROM education WHERE id = ?', [intEducationId]);

    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Education record not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

module.exports = router;
