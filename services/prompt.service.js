// Prompt builders are centralized here so AI behavior is easy to explain and update.

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

const formatResumeFactsForPrompt = (objResumePreviewData) => {
  const objProfile = objResumePreviewData?.profile || null;
  const arrEducation = objResumePreviewData?.education || [];
  const arrExperiences = objResumePreviewData?.experiences || [];
  const arrSkillsByCategory = objResumePreviewData?.skillsByCategory || [];
  const arrCertifications = objResumePreviewData?.certifications || [];
  const arrAwards = objResumePreviewData?.awards || [];

  return JSON.stringify(
    {
      profile: objProfile,
      education: arrEducation,
      experiences: arrExperiences,
      skillsByCategory: arrSkillsByCategory,
      certifications: arrCertifications,
      awards: arrAwards
    },
    null,
    2
  );
};

const buildCoverLetterPrompt = ({
  strJobTitle,
  strCompanyName = '',
  strJobDescription,
  objResumePreviewData
}) => {
  const strCompanyText = strCompanyName || 'Not provided';
  const strResumeFactsJson = formatResumeFactsForPrompt(objResumePreviewData);

  return `You are a resume assistant for a college capstone project.

Task:
Generate a concise, professional, student-friendly cover letter tailored to the target role.

Hard constraints:
1) Use only facts present in the provided resume data.
2) Do NOT invent employers, dates, certifications, awards, metrics, achievements, or personal details.
3) If specific facts are missing, keep wording general and truthful.
4) Avoid exaggerated claims and avoid robotic wording.
5) Keep the letter around 3-5 short paragraphs.
6) Return valid JSON only. No markdown. No code block fences.

Return JSON with this exact shape:
{
  "coverLetter": "string",
  "notes": ["string"]
}

Target Job Title:
${strJobTitle}

Target Company:
${strCompanyText}

Target Job Description:
${strJobDescription}

Resume Data (source of truth for user facts):
${strResumeFactsJson}

In notes, include at least 2 brief reminders for user review, such as adding a real hiring manager name if known.`;
};

module.exports = {
  buildBulletReviewPrompt,
  buildCoverLetterPrompt
};
