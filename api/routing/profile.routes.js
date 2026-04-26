const express = require('express');

const { all, get, run } = require('../../services/database.service');
const { sendError } = require('../../utils/responseHelpers');
const {
  normalizeOptionalString,
  validateRequiredStringField,
  validateOptionalEmail,
  validateOptionalUrl
} = require('../../utils/validators');
const { sanitizeRichText, sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

const buildProfileValues = (objBody) => {
  const strFirstName = sanitizePlainText(objBody.first_name || '');
  const strLastName = sanitizePlainText(objBody.last_name || '');

  return {
    first_name: strFirstName,
    last_name: strLastName,
    email: normalizeOptionalString(sanitizePlainText(objBody.email || '')),
    phone: normalizeOptionalString(sanitizePlainText(objBody.phone || '')),
    city: normalizeOptionalString(sanitizePlainText(objBody.city || '')),
    state: normalizeOptionalString(sanitizePlainText(objBody.state || '')),
    linkedin_url: normalizeOptionalString(sanitizePlainText(objBody.linkedin_url || '')),
    github_url: normalizeOptionalString(sanitizePlainText(objBody.github_url || '')),
    portfolio_url: normalizeOptionalString(sanitizePlainText(objBody.portfolio_url || '')),
    professional_summary: normalizeOptionalString(sanitizeRichText(objBody.professional_summary || ''))
  };
};

const validateProfileBody = (objBody) => {
  const arrErrors = [];

  const strFirstNameError = validateRequiredStringField(objBody, 'first_name');
  const strLastNameError = validateRequiredStringField(objBody, 'last_name');
  const strEmailError = validateOptionalEmail(objBody.email, 'email');
  const strLinkedInError = validateOptionalUrl(objBody.linkedin_url, 'linkedin_url');
  const strGitHubError = validateOptionalUrl(objBody.github_url, 'github_url');
  const strPortfolioError = validateOptionalUrl(objBody.portfolio_url, 'portfolio_url');

  [
    strFirstNameError,
    strLastNameError,
    strEmailError,
    strLinkedInError,
    strGitHubError,
    strPortfolioError
  ].forEach((strError) => {
    if (strError) {
      arrErrors.push(strError);
    }
  });

  return arrErrors;
};

router.get('/', async (_objRequest, objResponse, fnNext) => {
  try {
    const arrRows = await all('SELECT * FROM profiles ORDER BY id DESC');
    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intProfileId = Number(objRequest.params.id);

    if (!Number.isInteger(intProfileId) || intProfileId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objProfile = await get('SELECT * FROM profiles WHERE id = ?', [intProfileId]);

    if (!objProfile) {
      sendError(objResponse, 404, 'Profile not found.');
      return;
    }

    objResponse.json(objProfile);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/', async (objRequest, objResponse, fnNext) => {
  try {
    const arrErrors = validateProfileBody(objRequest.body || {});

    if (arrErrors.length > 0) {
      sendError(objResponse, 400, 'Validation failed.', { errors: arrErrors });
      return;
    }

    const objValues = buildProfileValues(objRequest.body || {});

    const objInsertResult = await run(
      `INSERT INTO profiles (
        first_name,
        last_name,
        email,
        phone,
        city,
        state,
        linkedin_url,
        github_url,
        portfolio_url,
        professional_summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        objValues.first_name,
        objValues.last_name,
        objValues.email,
        objValues.phone,
        objValues.city,
        objValues.state,
        objValues.linkedin_url,
        objValues.github_url,
        objValues.portfolio_url,
        objValues.professional_summary
      ]
    );

    const objCreatedProfile = await get('SELECT * FROM profiles WHERE id = ?', [objInsertResult.intLastId]);
    objResponse.status(201).json(objCreatedProfile);
  } catch (objError) {
    fnNext(objError);
  }
});

router.put('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intProfileId = Number(objRequest.params.id);

    if (!Number.isInteger(intProfileId) || intProfileId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const arrErrors = validateProfileBody(objRequest.body || {});

    if (arrErrors.length > 0) {
      sendError(objResponse, 400, 'Validation failed.', { errors: arrErrors });
      return;
    }

    const objValues = buildProfileValues(objRequest.body || {});

    const objUpdateResult = await run(
      `UPDATE profiles SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        city = ?,
        state = ?,
        linkedin_url = ?,
        github_url = ?,
        portfolio_url = ?,
        professional_summary = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        objValues.first_name,
        objValues.last_name,
        objValues.email,
        objValues.phone,
        objValues.city,
        objValues.state,
        objValues.linkedin_url,
        objValues.github_url,
        objValues.portfolio_url,
        objValues.professional_summary,
        intProfileId
      ]
    );

    if (objUpdateResult.intChanges === 0) {
      sendError(objResponse, 404, 'Profile not found.');
      return;
    }

    const objUpdatedProfile = await get('SELECT * FROM profiles WHERE id = ?', [intProfileId]);
    objResponse.json(objUpdatedProfile);
  } catch (objError) {
    fnNext(objError);
  }
});

router.delete('/:id', async (objRequest, objResponse, fnNext) => {
  try {
    const intProfileId = Number(objRequest.params.id);

    if (!Number.isInteger(intProfileId) || intProfileId <= 0) {
      sendError(objResponse, 400, 'id must be a positive integer.');
      return;
    }

    const objDeleteResult = await run('DELETE FROM profiles WHERE id = ?', [intProfileId]);

    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Profile not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

module.exports = router;
