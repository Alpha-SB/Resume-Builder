// Prompt builder for Gemini bullet review.
// Keeping prompt creation isolated makes provider changes easier later.

const buildBulletReviewPrompt = ({ strBulletText, strTargetJobDescription = '' }) => {
  const strJobDescriptionSection = strTargetJobDescription
    ? `Target Job Description:\n${strTargetJobDescription}`
    : 'Target Job Description: Not provided by user.';

  return `You are a resume assistant for a college capstone project.

Strict rules:
1) Do NOT invent facts.
2) Do NOT fabricate metrics, numbers, companies, dates, titles, certifications, or awards.
3) Preserve original meaning and truthfulness.
4) Improve clarity, action verbs, and ATS-style phrasing.
5) If quantification could help, ask a question to the user instead of inventing numbers.
6) Return valid JSON only. No markdown. No code block fences.

Return JSON object with this exact shape:
{
  "original": "string",
  "improved": "string",
  "atsVersion": "string",
  "issues": ["string"],
  "suggestions": ["string"],
  "questionsForUser": ["string"]
}

Bullet Text:\n${strBulletText}

${strJobDescriptionSection}

If the bullet is already strong, keep changes minimal and explain why in issues/suggestions.`;
};

module.exports = {
  buildBulletReviewPrompt
};
