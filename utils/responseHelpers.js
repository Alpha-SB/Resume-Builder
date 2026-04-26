const sendSuccess = (objResponse, intStatusCode, objPayload) => {
  objResponse.status(intStatusCode).json(objPayload);
};

const sendError = (objResponse, intStatusCode, strMessage, objDetails = null) => {
  const objErrorResponse = {
    error: strMessage
  };

  if (objDetails) {
    objErrorResponse.details = objDetails;
  }

  objResponse.status(intStatusCode).json(objErrorResponse);
};

module.exports = {
  sendSuccess,
  sendError
};
