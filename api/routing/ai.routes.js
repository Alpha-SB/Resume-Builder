const express = require('express');

const { requestGeminiReview } = require('../../services/ai.service');
const { get } = require('../../services/database.service');
const { sendError } = require('../../utils/responseHelpers');
const { validateRequiredStringField } = require('../../utils/validators');
const { sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

const resolveApiKey = async (objBody) => {
  const strRequestApiKey = sanitizePlainText(objBody.apiKey || '');
  if (strRequestApiKey) {
    return strRequestApiKey;
  }

  const objSavedSetting = await get(
    'SELECT setting_value FROM app_settings WHERE setting_key = ?',
    ['gemini_api_key']
  );

  const strSavedKey = sanitizePlainText(objSavedSetting?.setting_value || '');
  if (strSavedKey) {
    return strSavedKey;
  }

  const strEnvironmentKey = sanitizePlainText(process.env.GEMINI_API_KEY || '');
  return strEnvironmentKey || null;
};

router.post('/review-bullet', async (objRequest, objResponse, fnNext) => {
  try {
    const strBulletError = validateRequiredStringField(
      objRequest.body || {},
      'bulletText',
      1200
    );

    if (strBulletError) {
      sendError(objResponse, 400, 'Validation failed.', { errors: [strBulletError] });
      return;
    }

    const strBulletText = sanitizePlainText(objRequest.body.bulletText || '');
    const strTargetJobDescription = sanitizePlainText(
      objRequest.body.targetJobDescription || ''
    );

    const strResolvedApiKey = await resolveApiKey(objRequest.body || {});

    if (!strResolvedApiKey) {
      sendError(
        objResponse,
        400,
        'No Gemini API key available. Provide apiKey in request, save one in Settings, or configure GEMINI_API_KEY in .env for development.'
      );
      return;
    }

    const objReviewResponse = await requestGeminiReview({
      strBulletText,
      strTargetJobDescription,
      strApiKey: strResolvedApiKey
    });

    objResponse.json(objReviewResponse);
  } catch (objError) {
    if (objError.intStatus) {
      sendError(objResponse, objError.intStatus, objError.message || 'AI review request failed.');
      return;
    }

    fnNext(objError);
  }
});

module.exports = router;
