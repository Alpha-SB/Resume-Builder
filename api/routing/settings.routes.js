const express = require('express');

const { all, get, run } = require('../../services/database.service');
const { sendError } = require('../../utils/responseHelpers');
const {
  normalizeOptionalString,
  validateRequiredStringField
} = require('../../utils/validators');
const { sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

router.get('/', async (_objRequest, objResponse, fnNext) => {
  try {
    const arrRows = await all('SELECT * FROM app_settings ORDER BY setting_key ASC');
    objResponse.json(arrRows);
  } catch (objError) {
    fnNext(objError);
  }
});

router.get('/:key', async (objRequest, objResponse, fnNext) => {
  try {
    const strSettingKey = sanitizePlainText(objRequest.params.key || '');
    if (!strSettingKey) {
      sendError(objResponse, 400, 'key is required.');
      return;
    }

    const objSetting = await get('SELECT * FROM app_settings WHERE setting_key = ?', [strSettingKey]);
    if (!objSetting) {
      sendError(objResponse, 404, 'Setting not found.');
      return;
    }

    objResponse.json(objSetting);
  } catch (objError) {
    fnNext(objError);
  }
});

router.post('/', async (objRequest, objResponse, fnNext) => {
  try {
    const strKeyError = validateRequiredStringField(objRequest.body || {}, 'setting_key');
    if (strKeyError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strKeyError] });
      return;
    }

    const strSettingKey = sanitizePlainText(objRequest.body.setting_key || '');
    const strSettingValue = normalizeOptionalString(sanitizePlainText(objRequest.body.setting_value || ''));

    const objInsertResult = await run(
      'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)',
      [strSettingKey, strSettingValue]
    );

    const objCreated = await get('SELECT * FROM app_settings WHERE id = ?', [objInsertResult.intLastId]);
    objResponse.status(201).json(objCreated);
  } catch (objError) {
    // SQLite unique constraint error for duplicate setting keys.
    if (objError && String(objError.message || '').includes('UNIQUE constraint failed')) {
      sendError(objResponse, 409, 'setting_key already exists. Use PUT /api/settings/:key to update.');
      return;
    }

    fnNext(objError);
  }
});

router.put('/:key', async (objRequest, objResponse, fnNext) => {
  try {
    const strSettingKey = sanitizePlainText(objRequest.params.key || '');
    if (!strSettingKey) {
      sendError(objResponse, 400, 'key is required.');
      return;
    }

    const strValueError = validateRequiredStringField(objRequest.body || {}, 'setting_value', 4000);
    if (strValueError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strValueError] });
      return;
    }

    const strSettingValue = normalizeOptionalString(sanitizePlainText(objRequest.body.setting_value || ''));

    // Upsert behavior keeps settings logic simple for the frontend.
    const objExisting = await get('SELECT id FROM app_settings WHERE setting_key = ?', [strSettingKey]);

    if (!objExisting) {
      const objInsertResult = await run(
        'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)',
        [strSettingKey, strSettingValue]
      );

      const objCreated = await get('SELECT * FROM app_settings WHERE id = ?', [objInsertResult.intLastId]);
      objResponse.status(201).json(objCreated);
      return;
    }

    await run(
      `UPDATE app_settings SET
        setting_value = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ?`,
      [strSettingValue, strSettingKey]
    );

    const objUpdated = await get('SELECT * FROM app_settings WHERE setting_key = ?', [strSettingKey]);
    objResponse.json(objUpdated);
  } catch (objError) {
    fnNext(objError);
  }
});

router.delete('/:key', async (objRequest, objResponse, fnNext) => {
  try {
    const strSettingKey = sanitizePlainText(objRequest.params.key || '');
    if (!strSettingKey) {
      sendError(objResponse, 400, 'key is required.');
      return;
    }

    const objDeleteResult = await run('DELETE FROM app_settings WHERE setting_key = ?', [strSettingKey]);
    if (objDeleteResult.intChanges === 0) {
      sendError(objResponse, 404, 'Setting not found.');
      return;
    }

    objResponse.status(204).send();
  } catch (objError) {
    fnNext(objError);
  }
});

module.exports = router;
