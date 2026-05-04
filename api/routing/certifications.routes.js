const express = require('express');

const { all, get, run } = require('../../services/database.service');
const { sendError } = require('../../utils/responseHelpers');
const {
  normalizeOptionalString,
  validateOptionalUrlField
} = require('../../utils/validators');
const { sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

const buildCertificationValues = (objBody) => {
  return {
    certification_name: sanitizePlainText(objBody.certification_name || ''),
    issuing_organization: normalizeOptionalString(sanitizePlainText(objBody.issuing_organization || '')),
    issue_date: normalizeOptionalString(sanitizePlainText(objBody.issue_date || '')),
    expiration_date: normalizeOptionalString(sanitizePlainText(objBody.expiration_date || '')),
    credential_url: normalizeOptionalString(sanitizePlainText(objBody.credential_url || ''))
  };
};

const validateCertificationBody = (objBody) => {
  const arrErrors = [];
  const strCertificationName = sanitizePlainText(objBody.certification_name || '');

  if (!strCertificationName) {
    arrErrors.push({
      field: 'certification_name',
      message: 'Certification name is required.'
    });
  } else if (strCertificationName.length > 255) {
    arrErrors.push({
      field: 'certification_name',
      message: 'Certification name must be 255 characters or fewer.'
    });
  }

  const objCredentialUrlError = validateOptionalUrlField(
    objBody.credential_url,
    'credential_url',
    'Credential URL'
  );

  if (objCredentialUrlError) {
    arrErrors.push(objCredentialUrlError);
  }

  return arrErrors;
};

router.get('/', async (_objRequest, objResponse, fnNext) => {
  try {
    const arrRows = await all('SELECT * FROM certifications ORDER BY id DESC');
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

    const objRow = await get('SELECT * FROM certifications WHERE id = ?', [intId]);
    if (!objRow) {
      sendError(objResponse, 404, 'Certification not found.');
      return;
    }

    objResponse.json(objRow);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/', async (objRequest, objResponse, fnNext) => {
  try {
    const arrErrors = validateCertificationBody(objRequest.body || {});

    if (arrErrors.length > 0) {
      sendError(objResponse, 400, 'Please correct the highlighted fields.', { errors: arrErrors });
      return;
    }

    const objValues = buildCertificationValues(objRequest.body || {});

    const objInsertResult = await run(
      `INSERT INTO certifications (
        certification_name,
        issuing_organization,
        issue_date,
        expiration_date,
        credential_url
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        objValues.certification_name,
        objValues.issuing_organization,
        objValues.issue_date,
        objValues.expiration_date,
        objValues.credential_url
      ]
    );

    const objCreated = await get('SELECT * FROM certifications WHERE id = ?', [objInsertResult.intLastId]);
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

    const arrErrors = validateCertificationBody(objRequest.body || {});

    if (arrErrors.length > 0) {
      sendError(objResponse, 400, 'Please correct the highlighted fields.', { errors: arrErrors });
      return;
    }

    const objValues = buildCertificationValues(objRequest.body || {});

    const objUpdateResult = await run(
      `UPDATE certifications SET
        certification_name = ?,
        issuing_organization = ?,
        issue_date = ?,
        expiration_date = ?,
        credential_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        objValues.certification_name,
        objValues.issuing_organization,
        objValues.issue_date,
        objValues.expiration_date,
        objValues.credential_url,
        intId
      ]
    );

    if (objUpdateResult.intChanges === 0) {
      sendError(objResponse, 404, 'Certification not found.');
      return;
    }

    const objUpdated = await get('SELECT * FROM certifications WHERE id = ?', [intId]);
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

    const objDeleteResult = await run('DELETE FROM certifications WHERE id = ?', [intId]);
    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Certification not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

module.exports = router;
