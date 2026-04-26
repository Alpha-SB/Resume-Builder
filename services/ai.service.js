const { sanitizePlainText } = require('../utils/sanitize');
const { buildBulletReviewPrompt, buildCoverLetterPrompt } = require('./prompt.service');

const strGeminiApiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

// Keep the default model in one obvious place.
// If Google changes model availability later, update .env with GEMINI_MODEL.
const strDefaultGeminiModel = 'gemini-2.5-flash';

const getConfiguredGeminiModel = () => {
  const strEnvModel = sanitizePlainText(process.env.GEMINI_MODEL || '').trim();
  return strEnvModel || strDefaultGeminiModel;
};

const buildAiServiceError = ({
  intStatus = 500,
  strCode = 'GEMINI_UNKNOWN_ERROR',
  strMessage = 'AI request failed.',
  strDetails = 'Please try again in a moment.'
}) => {
  const objError = new Error(strMessage);
  objError.intStatus = intStatus;
  objError.strCode = strCode;
  objError.strDetails = strDetails;
  return objError;
};

const parseJsonFromText = (strRawText) => {
  const strTrimmedText = String(strRawText || '').trim();
  if (!strTrimmedText) {
    throw buildAiServiceError({
      intStatus: 502,
      strCode: 'GEMINI_MALFORMED_RESPONSE',
      strMessage: 'Gemini returned an empty response.',
      strDetails: 'Try the request again. If this keeps happening, simplify the input text and retry.'
    });
  }

  try {
    return JSON.parse(strTrimmedText);
  } catch (_objError) {
    // Recover JSON if the model wraps it in fences or extra text.
    const objFenceMatch = strTrimmedText.match(/```json\s*([\s\S]*?)```/i);
    if (objFenceMatch && objFenceMatch[1]) {
      return JSON.parse(objFenceMatch[1].trim());
    }

    const intFirstBrace = strTrimmedText.indexOf('{');
    const intLastBrace = strTrimmedText.lastIndexOf('}');
    if (intFirstBrace >= 0 && intLastBrace > intFirstBrace) {
      const strPossibleJson = strTrimmedText.slice(intFirstBrace, intLastBrace + 1);
      return JSON.parse(strPossibleJson);
    }

    throw buildAiServiceError({
      intStatus: 502,
      strCode: 'GEMINI_MALFORMED_RESPONSE',
      strMessage: 'Gemini returned content that was not valid JSON.',
      strDetails: 'Try again. If the issue continues, reduce input size and retry.'
    });
  }
};

const toSafeString = (value) => sanitizePlainText(value || '');

const toSafeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizePlainText(item || ''))
    .filter((item) => item.length > 0);
};

const normalizeReviewResponse = (objParsedResponse, strOriginalBullet) => {
  const strOriginal = toSafeString(objParsedResponse.original || strOriginalBullet);
  const strImproved = toSafeString(objParsedResponse.improved || strOriginal);
  const strAtsVersion = toSafeString(objParsedResponse.atsVersion || strImproved || strOriginal);

  return {
    original: strOriginal || strOriginalBullet,
    improved: strImproved || strOriginalBullet,
    atsVersion: strAtsVersion || strOriginalBullet,
    issues: toSafeStringArray(objParsedResponse.issues),
    suggestions: toSafeStringArray(objParsedResponse.suggestions),
    questionsForUser: toSafeStringArray(objParsedResponse.questionsForUser)
  };
};

const normalizeCoverLetterResponse = (objParsedResponse) => {
  const strCoverLetter = toSafeString(objParsedResponse.coverLetter || '');
  const arrNotes = toSafeStringArray(objParsedResponse.notes);

  if (!strCoverLetter) {
    throw buildAiServiceError({
      intStatus: 502,
      strCode: 'GEMINI_MALFORMED_RESPONSE',
      strMessage: 'Gemini did not return a usable cover letter.',
      strDetails: 'Try again with a clearer job description and selected resume data.'
    });
  }

  return {
    coverLetter: strCoverLetter,
    notes: arrNotes
  };
};

const mapGeminiHttpError = (intStatus, objResponseBody) => {
  const strApiMessage = sanitizePlainText(objResponseBody?.error?.message || '');
  const strApiStatus = sanitizePlainText(objResponseBody?.error?.status || '');
  const strCombined = `${strApiStatus} ${strApiMessage}`.toLowerCase();

  if (intStatus === 401 || intStatus === 403 || strCombined.includes('api key')) {
    return buildAiServiceError({
      intStatus: 401,
      strCode: 'GEMINI_INVALID_API_KEY',
      strMessage: 'Gemini rejected the API key.',
      strDetails: 'Check your Gemini API key in Settings or .env, then try again.'
    });
  }

  if (intStatus === 404 || strCombined.includes('model') || strCombined.includes('not found')) {
    return buildAiServiceError({
      intStatus: 404,
      strCode: 'GEMINI_MODEL_NOT_FOUND',
      strMessage: 'The configured Gemini model could not be found or does not support generateContent.',
      strDetails: `Try setting GEMINI_MODEL=${strDefaultGeminiModel} in your .env file, then restart the server.`
    });
  }

  if (intStatus === 429 || strCombined.includes('rate limit')) {
    return buildAiServiceError({
      intStatus: 429,
      strCode: 'GEMINI_RATE_LIMIT',
      strMessage: 'Gemini rate limit reached.',
      strDetails: 'Wait a moment and retry. If this repeats, reduce request frequency.'
    });
  }

  if (intStatus >= 500) {
    return buildAiServiceError({
      intStatus: 502,
      strCode: 'GEMINI_UPSTREAM_ERROR',
      strMessage: 'Gemini service is temporarily unavailable.',
      strDetails: 'Please try again shortly.'
    });
  }

  return buildAiServiceError({
    intStatus: intStatus || 502,
    strCode: 'GEMINI_API_ERROR',
    strMessage: 'Gemini API request failed.',
    strDetails: strApiMessage || 'Review your request and API key settings, then retry.'
  });
};

const readGeminiResponseText = (objResponseBody) => {
  const strGeminiText = (objResponseBody?.candidates || [])
    .flatMap((objCandidate) => objCandidate?.content?.parts || [])
    .map((objPart) => objPart?.text || '')
    .join('\n')
    .trim();

  if (strGeminiText) {
    return strGeminiText;
  }

  const strBlockReason = sanitizePlainText(objResponseBody?.promptFeedback?.blockReason || '');
  const blnSafetyBlocked = strBlockReason.length > 0
    || (objResponseBody?.candidates || []).some((objCandidate) => {
      const strFinishReason = sanitizePlainText(objCandidate?.finishReason || '');
      return strFinishReason.toUpperCase() === 'SAFETY';
    });

  if (blnSafetyBlocked) {
    throw buildAiServiceError({
      intStatus: 422,
      strCode: 'GEMINI_CONTENT_BLOCKED',
      strMessage: 'Gemini could not process this request due to content safety rules.',
      strDetails: 'Revise the text and try again with professional, non-sensitive wording.'
    });
  }

  throw buildAiServiceError({
    intStatus: 502,
    strCode: 'GEMINI_MALFORMED_RESPONSE',
    strMessage: 'Gemini API returned no content.',
    strDetails: 'Try again. If this continues, adjust the input and retry.'
  });
};

const requestGeminiJson = async ({ strPrompt, strApiKey }) => {
  const strModelName = getConfiguredGeminiModel();

  // URL shape is .../models/{model}:generateContent. Do not include "models/" in model name.
  const strRequestUrl = `${strGeminiApiBaseUrl}/models/${encodeURIComponent(strModelName)}:generateContent?key=${encodeURIComponent(strApiKey)}`;

  const objAbortController = new AbortController();
  const intRequestTimeoutMs = 30000;
  const intTimeoutId = setTimeout(() => objAbortController.abort(), intRequestTimeoutMs);

  try {
    const objResponse = await fetch(strRequestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: objAbortController.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: strPrompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    });

    let objResponseBody = null;
    try {
      objResponseBody = await objResponse.json();
    } catch (_objParseError) {
      objResponseBody = null;
    }

    if (!objResponse.ok) {
      throw mapGeminiHttpError(objResponse.status, objResponseBody);
    }

    const strGeminiText = readGeminiResponseText(objResponseBody);
    return parseJsonFromText(strGeminiText);
  } catch (objError) {
    if (objError.name === 'AbortError') {
      throw buildAiServiceError({
        intStatus: 504,
        strCode: 'GEMINI_TIMEOUT',
        strMessage: 'Gemini request timed out.',
        strDetails: 'Try again. If needed, shorten the input text and retry.'
      });
    }

    if (objError instanceof TypeError) {
      throw buildAiServiceError({
        intStatus: 502,
        strCode: 'GEMINI_NETWORK_ERROR',
        strMessage: 'Unable to reach Gemini API.',
        strDetails: 'Check your internet connection and firewall settings, then try again.'
      });
    }

    if (objError.intStatus) {
      throw objError;
    }

    throw buildAiServiceError({
      intStatus: 500,
      strCode: 'GEMINI_UNKNOWN_ERROR',
      strMessage: 'Unable to process the AI request at this time.',
      strDetails: 'Please try again in a moment.'
    });
  } finally {
    clearTimeout(intTimeoutId);
  }
};

const requestGeminiReview = async ({
  strBulletText,
  strTargetJobDescription = '',
  strApiKey
}) => {
  const strPrompt = buildBulletReviewPrompt({
    strBulletText,
    strTargetJobDescription
  });

  const objParsedResponse = await requestGeminiJson({
    strPrompt,
    strApiKey
  });

  return normalizeReviewResponse(objParsedResponse, strBulletText);
};

const requestGeminiCoverLetter = async ({
  strJobTitle,
  strCompanyName = '',
  strJobDescription,
  objResumePreviewData,
  strApiKey
}) => {
  const strPrompt = buildCoverLetterPrompt({
    strJobTitle,
    strCompanyName,
    strJobDescription,
    objResumePreviewData
  });

  const objParsedResponse = await requestGeminiJson({
    strPrompt,
    strApiKey
  });

  return normalizeCoverLetterResponse(objParsedResponse);
};

module.exports = {
  strDefaultGeminiModel,
  getConfiguredGeminiModel,
  requestGeminiReview,
  requestGeminiCoverLetter
};
