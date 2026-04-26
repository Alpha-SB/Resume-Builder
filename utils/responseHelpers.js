const sendSuccess = (objResponse, intStatusCode, objPayload) => {
  objResponse.status(intStatusCode).json(objPayload);
};

const sendError = (objResponse, intStatusCode, strMessage, objDetails = null) => {
  // Keep one consistent error shape so frontend code can show helpful messages.
  const objErrorResponse = {
    success: false,
    message: strMessage
  };

  if (objDetails) {
    if (Array.isArray(objDetails.errors)) {
      objErrorResponse.errors = objDetails.errors;
    }

    if (objDetails.error && typeof objDetails.error === 'object') {
      objErrorResponse.error = objDetails.error;
      if (!objErrorResponse.message && objDetails.error.message) {
        objErrorResponse.message = objDetails.error.message;
      }
    } else if (typeof objDetails.error === 'string') {
      objErrorResponse.error = objDetails.error;
    }

    if (Object.prototype.hasOwnProperty.call(objDetails, 'details')) {
      objErrorResponse.details = objDetails.details;
    } else if (!objErrorResponse.errors && !objErrorResponse.error) {
      objErrorResponse.details = objDetails;
    }
  }

  if (!objErrorResponse.error) {
    // Keep the legacy `error` string for backward compatibility.
    objErrorResponse.error = strMessage;
  }

  objResponse.status(intStatusCode).json(objErrorResponse);
};

module.exports = {
  sendSuccess,
  sendError
};
