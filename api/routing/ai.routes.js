const express = require('express');

const {
  requestGeminiReview,
  requestGeminiCoverLetter
} = require('../../services/ai.service');
const { get } = require('../../services/database.service');
const { buildResumePreviewData } = require('../../services/resume.service');
const { sendError } = require('../../utils/responseHelpers');
const { sanitizePlainText } = require('../../utils/sanitize');

const router = express.Router();

const parsePositiveInteger = (value) => {
  const intValue = Number(value);
  if (!Number.isInteger(intValue) || intValue <= 0) {
    return null;
  }

  return intValue;
};

const sendAiError = (objResponse, intStatus, strCode, strMessage, strDetails) => {
  objResponse.status(intStatus).json({
    success: false,
    error: {
      code: strCode,
      message: strMessage,
      details: strDetails
    }
  });
};

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
    const strBulletText = sanitizePlainText(objRequest.body?.bulletText || '');
    const strTargetJobDescription = sanitizePlainText(
      objRequest.body?.targetJobDescription || ''
    );

    if (!strBulletText) {
      sendError(objResponse, 400, 'Please correct the highlighted fields.', {
        errors: [
          {
            field: 'bulletText',
            message: 'Bullet text is required.'
          }
        ]
      });
      return;
    }

    if (strBulletText.length > 1200) {
      sendError(objResponse, 400, 'Please correct the highlighted fields.', {
        errors: [
          {
            field: 'bulletText',
            message: 'Bullet text must be 1200 characters or fewer.'
          }
        ]
      });
      return;
    }

    const strResolvedApiKey = await resolveApiKey(objRequest.body || {});

    if (!strResolvedApiKey) {
      sendAiError(
        objResponse,
        400,
        'GEMINI_MISSING_API_KEY',
        'No Gemini API key is available.',
        'Provide apiKey in this request, save one in Settings, or set GEMINI_API_KEY in .env for development.'
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
    if (objError.intStatus && objError.strCode) {
      sendAiError(
        objResponse,
        objError.intStatus,
        objError.strCode,
        objError.message || 'AI review request failed.',
        objError.strDetails || 'Please try again.'
      );
      return;
    }

    fnNext(objError);
  }
});

router.post('/generate-cover-letter', async (objRequest, objResponse, fnNext) => {
  try {
    const intResumeId = parsePositiveInteger(objRequest.body?.resumeId);
    const strJobTitle = sanitizePlainText(objRequest.body?.jobTitle || '');
    const strCompanyName = sanitizePlainText(objRequest.body?.companyName || '');
    const strJobDescription = sanitizePlainText(objRequest.body?.jobDescription || '');

    const arrValidationErrors = [];

    if (!intResumeId) {
      arrValidationErrors.push({
        field: 'resumeId',
        message: 'Please select a saved resume before generating a cover letter.'
      });
    }

    if (!strJobTitle) {
      arrValidationErrors.push({
        field: 'jobTitle',
        message: 'Job title is required.'
      });
    }

    if (!strJobDescription) {
      arrValidationErrors.push({
        field: 'jobDescription',
        message: 'Job description is required.'
      });
    }

    if (arrValidationErrors.length > 0) {
      sendError(objResponse, 400, 'Please correct the highlighted fields.', {
        errors: arrValidationErrors
      });
      return;
    }

    const objResumePreviewData = await buildResumePreviewData(intResumeId);

    if (!objResumePreviewData) {
      sendError(objResponse, 404, 'Selected resume could not be found.', {
        errors: [
          {
            field: 'resumeId',
            message: 'Choose a valid saved resume and try again.'
          }
        ]
      });
      return;
    }

    const strResolvedApiKey = await resolveApiKey(objRequest.body || {});

    if (!strResolvedApiKey) {
      sendAiError(
        objResponse,
        400,
        'GEMINI_MISSING_API_KEY',
        'No Gemini API key is available.',
        'Open Settings to save a key, pass apiKey in this request, or set GEMINI_API_KEY in .env for development.'
      );
      return;
    }

    const objCoverLetterResponse = await requestGeminiCoverLetter({
      strJobTitle,
      strCompanyName,
      strJobDescription,
      objResumePreviewData,
      strApiKey: strResolvedApiKey
    });

    objResponse.json({
      success: true,
      coverLetter: objCoverLetterResponse.coverLetter,
      notes: objCoverLetterResponse.notes
    });
  } catch (objError) {
    if (objError.intStatus && objError.strCode) {
      sendAiError(
        objResponse,
        objError.intStatus,
        objError.strCode,
        objError.message || 'Cover letter generation failed.',
        objError.strDetails || 'Please try again.'
      );
      return;
    }

    fnNext(objError);
  }
});

module.exports = router;
