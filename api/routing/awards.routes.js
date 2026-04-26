const express = require('express');

const { all, get, run } = require('../../services/database.service');
const { sendError } = require('../../utils/responseHelpers');
const {
  normalizeOptionalString,
  validateRequiredStringField
} = require('../../utils/validators');
const { sanitizeRichText, sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

const buildAwardValues = (objBody) => {
  return {
    award_name: sanitizePlainText(objBody.award_name || ''),
    issuing_organization: normalizeOptionalString(sanitizePlainText(objBody.issuing_organization || '')),
    award_date: normalizeOptionalString(sanitizePlainText(objBody.award_date || '')),
    description: normalizeOptionalString(sanitizeRichText(objBody.description || ''))
  };
};

router.get('/', async (_objRequest, objResponse, fnNext) => {
  try {
    const arrRows = await all('SELECT * FROM awards ORDER BY id DESC');
    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intId = Number(objRequest.params.id);
    if (!Number.isInteger(intId) || intId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objRow = await get('SELECT * FROM awards WHERE id = ?', [intId]);
    if (!objRow) {
      sendError(objResponse, 404, 'Award not found.');
      return;
    }

    objResponse.json(objRow);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/', async (objRequest, objResponse, fnNext) => {
  try {
    const strNameError = validateRequiredStringField(objRequest.body || {}, 'award_name');
    if (strNameError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strNameError] });
      return;
    }

    const objValues = buildAwardValues(objRequest.body || {});

    const objInsertResult = await run(
      `INSERT INTO awards (
        award_name,
        issuing_organization,
        award_date,
        description
      ) VALUES (?, ?, ?, ?)`,
      [
        objValues.award_name,
        objValues.issuing_organization,
        objValues.award_date,
        objValues.description
      ]
    );

    const objCreated = await get('SELECT * FROM awards WHERE id = ?', [objInsertResult.intLastId]);
    objResponse.status(201).json(objCreated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.put('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intId = Number(objRequest.params.id);
    if (!Number.isInteger(intId) || intId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const strNameError = validateRequiredStringField(objRequest.body || {}, 'award_name');
    if (strNameError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strNameError] });
      return;
    }

    const objValues = buildAwardValues(objRequest.body || {});

    const objUpdateResult = await run(
      `UPDATE awards SET
        award_name = ?,
        issuing_organization = ?,
        award_date = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        objValues.award_name,
        objValues.issuing_organization,
        objValues.award_date,
        objValues.description,
        intId
      ]
    );

    if (objUpdateResult.intChanges === 0) {
      sendError(objResponse, 404, 'Award not found.');
      return;
    }

    const objUpdated = await get('SELECT * FROM awards WHERE id = ?', [intId]);
    objResponse.json(objUpdated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.delete('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intId = Number(objRequest.params.id);
    if (!Number.isInteger(intId) || intId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objDeleteResult = await run('DELETE FROM awards WHERE id = ?', [intId]);
    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Award not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

module.exports = router;
