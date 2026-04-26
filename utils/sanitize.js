const sanitizeHtml = require('sanitize-html');

// Shared HTML sanitization helper. This is intentionally strict by default
// to avoid unsafe HTML entering the UI.
const sanitizeRichText = (strRawValue = '') => {
  return sanitizeHtml(String(strRawValue), {
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'p',
      'ul',
      'ol',
      'li',
      'br'
    ],
    allowedAttributes: {}
  });
};

const sanitizePlainText = (strRawValue = '') => {
  return sanitizeHtml(String(strRawValue), {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();
};

module.exports = {
  sanitizeRichText,
  sanitizePlainText
};
