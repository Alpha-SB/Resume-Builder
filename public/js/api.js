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

const buildErrorMessage = (objErrorBody, objResponse, strFallback) => {
  if (objErrorBody && typeof objErrorBody === 'object') {
    if (objErrorBody.error) {
      return objErrorBody.error;
    }
  }

  return strFallback || `Request failed with status ${objResponse.status}.`;
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
