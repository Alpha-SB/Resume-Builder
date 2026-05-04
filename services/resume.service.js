const { all, get, run } = require('./database.service');

const arrAllowedResumeItemTypes = [
  'education',
  'experience',
  'experience_bullet',
  'skill',
  'skill_category',
  'certification',
  'award'
];

const getResumeList = async () => {
  return all('SELECT * FROM resumes ORDER BY updated_at DESC, id DESC');
};

const getResumeById = async (intResumeId) => {
  return get('SELECT * FROM resumes WHERE id = ?', [intResumeId]);
};

const getResumeItems = async (intResumeId) => {
  return all(
    'SELECT * FROM resume_items WHERE resume_id = ? ORDER BY sort_order ASC, id ASC',
    [intResumeId]
  );
};

const createResume = async (objResumeValues) => {
  const objInsertResult = await run(
    `INSERT INTO resumes (
      resume_name,
      target_job_title,
      target_company,
      target_job_description
    ) VALUES (?, ?, ?, ?)`,
    [
      objResumeValues.resume_name,
      objResumeValues.target_job_title,
      objResumeValues.target_company,
      objResumeValues.target_job_description
    ]
  );

  return getResumeById(objInsertResult.intLastId);
};

const updateResume = async (intResumeId, objResumeValues) => {
  await run(
    `UPDATE resumes SET
      resume_name = ?,
      target_job_title = ?,
      target_company = ?,
      target_job_description = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      objResumeValues.resume_name,
      objResumeValues.target_job_title,
      objResumeValues.target_company,
      objResumeValues.target_job_description,
      intResumeId
    ]
  );

  return getResumeById(intResumeId);
};

const deleteResume = async (intResumeId) => {
  return run('DELETE FROM resumes WHERE id = ?', [intResumeId]);
};

const replaceResumeItems = async (intResumeId, arrItems) => {
  await run('BEGIN TRANSACTION');

  try {
    await run('DELETE FROM resume_items WHERE resume_id = ?', [intResumeId]);

    for (const objItem of arrItems) {
      await run(
        `INSERT INTO resume_items (
          resume_id,
          item_type,
          item_id,
          sort_order
        ) VALUES (?, ?, ?, ?)`,
        [
          intResumeId,
          objItem.item_type,
          objItem.item_id,
          objItem.sort_order
        ]
      );
    }

    await run('COMMIT');
  } catch (objError) {
    await run('ROLLBACK');
    throw objError;
  }

  return getResumeItems(intResumeId);
};

const getIdsForType = (arrItems, strType) => {
  return arrItems
    .filter((objItem) => objItem.item_type === strType)
    .sort((objA, objB) => objA.sort_order - objB.sort_order || objA.id - objB.id)
    .map((objItem) => objItem.item_id);
};

const orderRecordsByIdList = (arrRecords, arrOrderedIds) => {
  const mapRecordById = new Map(arrRecords.map((objRecord) => [objRecord.id, objRecord]));
  return arrOrderedIds.map((intId) => mapRecordById.get(intId)).filter(Boolean);
};

const buildResumePreviewData = async (intResumeId) => {
  const objResume = await getResumeById(intResumeId);
  if (!objResume) {
    return null;
  }

  const arrResumeItems = await getResumeItems(intResumeId);

  const arrEducationIds = getIdsForType(arrResumeItems, 'education');
  const arrExperienceIds = getIdsForType(arrResumeItems, 'experience');
  const arrBulletIds = getIdsForType(arrResumeItems, 'experience_bullet');
  const arrSkillIds = getIdsForType(arrResumeItems, 'skill');
  const arrSkillCategoryIds = getIdsForType(arrResumeItems, 'skill_category');
  const arrCertificationIds = getIdsForType(arrResumeItems, 'certification');
  const arrAwardIds = getIdsForType(arrResumeItems, 'award');

  const objProfile = await get('SELECT * FROM profiles ORDER BY updated_at DESC, id DESC LIMIT 1');

  const arrEducationAll = await all('SELECT * FROM education ORDER BY id ASC');
  const arrEducation = orderRecordsByIdList(arrEducationAll, arrEducationIds);

  const arrExperienceAll = await all('SELECT * FROM experiences ORDER BY id ASC');
  const arrExperienceSelected = orderRecordsByIdList(arrExperienceAll, arrExperienceIds);

  const mapSelectedExperienceIds = new Set(arrExperienceIds);
  const arrBulletsAll = await all(
    'SELECT * FROM experience_bullets ORDER BY sort_order ASC, id ASC'
  );

  const mapSelectedBulletIds = new Set(arrBulletIds);

  const arrExperienceWithBullets = arrExperienceSelected.map((objExperience) => {
    const arrBulletsForExperience = arrBulletsAll
      .filter((objBullet) => mapSelectedExperienceIds.has(objBullet.experience_id))
      .filter((objBullet) => objBullet.experience_id === objExperience.id)
      .filter((objBullet) => {
        // If no bullets were explicitly selected, include all bullets for selected experiences.
        if (mapSelectedBulletIds.size === 0) {
          return true;
        }

        return mapSelectedBulletIds.has(objBullet.id);
      })
      .sort((objA, objB) => objA.sort_order - objB.sort_order || objA.id - objB.id);

    return {
      ...objExperience,
      bullets: arrBulletsForExperience
    };
  });

  const arrSkillRows = await all(
    `SELECT
      skills.*,
      skill_categories.category_name
    FROM skills
    LEFT JOIN skill_categories ON skills.skill_category_id = skill_categories.id
    ORDER BY skills.sort_order ASC, skills.id ASC`
  );

  const mapSelectedSkillIds = new Set(arrSkillIds);
  const mapSelectedSkillCategoryIds = new Set(arrSkillCategoryIds);

  const arrSelectedSkills = arrSkillRows.filter((objSkill) => {
    if (mapSelectedSkillIds.has(objSkill.id)) {
      return true;
    }

    if (objSkill.skill_category_id && mapSelectedSkillCategoryIds.has(objSkill.skill_category_id)) {
      return true;
    }

    return false;
  });

  const mapSkillsByCategory = new Map();

  arrSelectedSkills.forEach((objSkill) => {
    const strCategoryName = objSkill.category_name || 'General Skills';
    if (!mapSkillsByCategory.has(strCategoryName)) {
      mapSkillsByCategory.set(strCategoryName, []);
    }

    mapSkillsByCategory.get(strCategoryName).push(objSkill);
  });

  const arrSkillsByCategory = Array.from(mapSkillsByCategory.entries()).map(([strCategoryName, arrSkills]) => ({
    category_name: strCategoryName,
    skills: arrSkills.map((objSkill) => objSkill.skill_name)
  }));

  const arrCertificationsAll = await all('SELECT * FROM certifications ORDER BY id ASC');
  const arrCertifications = orderRecordsByIdList(arrCertificationsAll, arrCertificationIds);

  const arrAwardsAll = await all('SELECT * FROM awards ORDER BY id ASC');
  const arrAwards = orderRecordsByIdList(arrAwardsAll, arrAwardIds);

  return {
    resume: objResume,
    profile: objProfile,
    education: arrEducation,
    experiences: arrExperienceWithBullets,
    skillsByCategory: arrSkillsByCategory,
    certifications: arrCertifications,
    awards: arrAwards,
    selectedItemCount: arrResumeItems.length
  };
};

module.exports = {
  arrAllowedResumeItemTypes,
  getResumeList,
  getResumeById,
  getResumeItems,
  createResume,
  updateResume,
  deleteResume,
  replaceResumeItems,
  buildResumePreviewData
};
