const { sanitizePlainText } = require('../utils/sanitize');
const { buildBulletReviewPrompt } = require('./prompt.service');

const strGeminiApiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

const parseJsonFromText = (strRawText) => {
  const strTrimmedText = String(strRawText || '').trim();
  if (!strTrimmedText) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return JSON.parse(strTrimmedText);
  } catch (_objError) {
    // Attempt to recover JSON if model wraps output in extra text or fences.
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

    throw new Error('Gemini response was not valid JSON.');
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

const buildApiError = (intStatus, strMessage) => {
  const objError = new Error(strMessage);
  objError.intStatus = intStatus;
  return objError;
};

const requestGeminiReview = async ({
  strBulletText,
  strTargetJobDescription = '',
  strApiKey
}) => {
  const strModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const strPrompt = buildBulletReviewPrompt({
    strBulletText,
    strTargetJobDescription
  });

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
      const strApiMessage = sanitizePlainText(
        objResponseBody?.error?.message || 'Gemini API request failed.'
      );

      throw buildApiError(objResponse.status, strApiMessage || 'Gemini API request failed.');
    }

    const strGeminiText = (objResponseBody?.candidates || [])
      .flatMap((objCandidate) => objCandidate?.content?.parts || [])
      .map((objPart) => objPart?.text || '')
      .join('\n')
      .trim();

    if (!strGeminiText) {
      throw buildApiError(502, 'Gemini API returned no review content.');
    }

    const objParsedResponse = parseJsonFromText(strGeminiText);

    return normalizeReviewResponse(objParsedResponse, strBulletText);
  } catch (objError) {
    if (objError.name === 'AbortError') {
      throw buildApiError(504, 'Gemini request timed out. Please try again.');
    }

    if (objError instanceof TypeError) {
      throw buildApiError(
        502,
        'Unable to reach Gemini API. Check internet access and API key settings.'
      );
    }

    if (objError.intStatus) {
      throw objError;
    }

    throw buildApiError(500, 'Unable to process AI review at this time.');
  } finally {
    clearTimeout(intTimeoutId);
  }
};

module.exports = {
  requestGeminiReview
};
