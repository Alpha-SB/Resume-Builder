const validator = require('validator');

const isNonEmptyString = (strValue) => {
  return typeof strValue === 'string' && strValue.trim().length > 0;
};

const normalizeOptionalString = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const strTrimmedValue = value.trim();
  return strTrimmedValue.length > 0 ? strTrimmedValue : null;
};

const validateRequiredStringField = (objSource, strFieldName, intMaxLength = 255) => {
  const value = objSource[strFieldName];

  if (!isNonEmptyString(value)) {
    return `${strFieldName} is required and must be a non-empty string.`;
  }

  if (!validator.isLength(value.trim(), { min: 1, max: intMaxLength })) {
    return `${strFieldName} must be between 1 and ${intMaxLength} characters.`;
  }

  return null;
};

const validateOptionalUrlField = (strUrlValue, strFieldName, strFieldLabel = 'URL') => {
  if (!isNonEmptyString(strUrlValue)) {
    return null;
  }

  const strTrimmedUrl = strUrlValue.trim();

  if (!/^https?:\/\//i.test(strTrimmedUrl)) {
    return {
      field: strFieldName,
      message: `${strFieldLabel} must begin with http:// or https://.`
    };
  }

  if (!validator.isURL(strTrimmedUrl, { require_protocol: true, protocols: ['http', 'https'] })) {
    return {
      field: strFieldName,
      message: `${strFieldLabel} must be a valid URL.`
    };
  }

  return null;
};

const validateOptionalUrl = (strUrlValue, strFieldName) => {
  const objError = validateOptionalUrlField(strUrlValue, strFieldName, strFieldName);
  return objError ? objError.message : null;
};

const validateOptionalEmailField = (strEmailValue, strFieldName, strFieldLabel = 'Email') => {
  if (!isNonEmptyString(strEmailValue)) {
    return null;
  }

  if (!validator.isEmail(strEmailValue.trim())) {
    return {
      field: strFieldName,
      message: `${strFieldLabel} must be a valid email address.`
    };
  }

  return null;
};

const validateOptionalEmail = (strEmailValue, strFieldName) => {
  const objError = validateOptionalEmailField(strEmailValue, strFieldName, strFieldName);
  return objError ? objError.message : null;
};

module.exports = {
  isNonEmptyString,
  normalizeOptionalString,
  validateRequiredStringField,
  validateOptionalUrl,
  validateOptionalUrlField,
  validateOptionalEmail,
  validateOptionalEmailField
};
