const createInitialState = () => {
  return {
    strCurrentSection: 'dashboard',
    intCurrentResumeId: null,
    strAiTargetJobDescription: '',
    intEditingEducationId: null,
    intEditingExperienceId: null,
    intEditingSkillId: null,
    intEditingSkillCategoryId: null,
    intEditingCertificationId: null,
    intEditingAwardId: null,
    objProfileDraft: null,
    intCoverLetterResumeId: null,
    strCoverLetterJobTitle: '',
    strCoverLetterCompanyName: '',
    strCoverLetterJobDescription: '',
    strCoverLetterText: '',
    arrCoverLetterNotes: []
  };
};

export { createInitialState };
