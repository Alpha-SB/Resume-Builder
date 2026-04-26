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

const validateOptionalUrl = (strUrlValue, strFieldName) => {
  if (!isNonEmptyString(strUrlValue)) {
    return null;
  }

  if (!validator.isURL(strUrlValue.trim(), { require_protocol: true })) {
    return `${strFieldName} must be a valid URL including http:// or https://.`;
  }

  return null;
};

const validateOptionalEmail = (strEmailValue, strFieldName) => {
  if (!isNonEmptyString(strEmailValue)) {
    return null;
  }

  if (!validator.isEmail(strEmailValue.trim())) {
    return `${strFieldName} must be a valid email address.`;
  }

  return null;
};

module.exports = {
  isNonEmptyString,
  normalizeOptionalString,
  validateRequiredStringField,
  validateOptionalUrl,
  validateOptionalEmail
};
