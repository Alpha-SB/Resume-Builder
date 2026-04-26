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
    objProfileDraft: null
  };
};

export { createInitialState };
