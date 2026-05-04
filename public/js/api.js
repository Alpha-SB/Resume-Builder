const strApiBasePath = '/api';

const parseResponseBody = async (objResponse) => {
  const strContentType = objResponse.headers.get('content-type') || '';

  if (strContentType.includes('application/json')) {
    return objResponse.json();
  }

  if (objResponse.status === 204) {
    return null;
  }

  const strText = await objResponse.text();
  return strText || null;
};

const joinMessageParts = (strPrimary, strSecondary = '') => {
  const arrParts = [strPrimary, strSecondary]
    .map((strValue) => String(strValue || '').trim())
    .filter((strValue) => strValue.length > 0);

  return arrParts.join(' ');
};

const buildErrorMessage = (objErrorBody, objResponse, strFallback) => {
  if (objErrorBody && typeof objErrorBody === 'object') {
    if (objErrorBody.error && typeof objErrorBody.error === 'object') {
      const strMessage = objErrorBody.error.message || '';
      const strDetails = objErrorBody.error.details || '';
      const strCombined = joinMessageParts(strMessage, strDetails);
      if (strCombined) {
        return strCombined;
      }
    }

    if (typeof objErrorBody.message === 'string' && objErrorBody.message.trim()) {
      if (typeof objErrorBody.details === 'string' && objErrorBody.details.trim()) {
        return joinMessageParts(objErrorBody.message, objErrorBody.details);
      }

      return objErrorBody.message;
    }

    if (typeof objErrorBody.error === 'string' && objErrorBody.error.trim()) {
      return objErrorBody.error;
    }
  }

  return strFallback || `Request failed with status ${objResponse.status}.`;
};

const normalizeValidationErrors = (objErrorBody) => {
  if (!objErrorBody || typeof objErrorBody !== 'object') {
    return [];
  }

  if (Array.isArray(objErrorBody.errors)) {
    return objErrorBody.errors;
  }

  if (Array.isArray(objErrorBody.details?.errors)) {
    return objErrorBody.details.errors;
  }

  return [];
};

const apiRequest = async (strMethod, strPath, objBody = null) => {
  const objOptions = {
    method: strMethod,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (objBody !== null) {
    objOptions.body = JSON.stringify(objBody);
  }

  const objResponse = await fetch(`${strApiBasePath}${strPath}`, objOptions);
  const objResponseBody = await parseResponseBody(objResponse);

  if (!objResponse.ok) {
    const objApiError = new Error(
      buildErrorMessage(objResponseBody, objResponse, `Request failed with status ${objResponse.status}.`)
    );

    objApiError.intStatus = objResponse.status;
    objApiError.arrErrors = normalizeValidationErrors(objResponseBody);
    objApiError.objError = (objResponseBody && typeof objResponseBody.error === 'object')
      ? objResponseBody.error
      : null;
    objApiError.objDetails = objResponseBody?.details || null;
    throw objApiError;
  }

  return objResponseBody;
};

const apiGet = async (strPath) => apiRequest('GET', strPath);
const apiPost = async (strPath, objBody) => apiRequest('POST', strPath, objBody);
const apiPut = async (strPath, objBody) => apiRequest('PUT', strPath, objBody);
const apiDelete = async (strPath) => apiRequest('DELETE', strPath);

export {
  apiGet,
  apiPost,
  apiPut,
  apiDelete
};
