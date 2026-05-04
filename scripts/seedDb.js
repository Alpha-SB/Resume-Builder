const {
  initializeDatabase,
  seedDatabase,
  get
} = require('../services/database.service');

const countExistingContentRows = async () => {
  const arrTrackedTables = [
    'profiles',
    'education',
    'experiences',
    'experience_bullets',
    'skills',
    'skill_categories',
    'certifications',
    'awards',
    'resumes',
    'resume_items'
  ];

  let intTotalRows = 0;
  for (const strTableName of arrTrackedTables) {
    const objCountResult = await get(`SELECT COUNT(*) AS intCount FROM ${strTableName}`);
    intTotalRows += Number(objCountResult?.intCount || 0);
  }

  return intTotalRows;
};

const runSeed = async () => {
  try {
    // Ensure schema exists before trying to apply seed records.
    await initializeDatabase();

    const intExistingRows = await countExistingContentRows();
    const blnAllowNonEmptySeed = String(process.env.SEED_ALLOW_NONEMPTY || '').toLowerCase() === 'true';

    if (intExistingRows > 0 && !blnAllowNonEmptySeed) {
      console.error(
        'Seed cancelled because database already contains content rows. ' +
        'If you intentionally want duplicate seed data, run with SEED_ALLOW_NONEMPTY=true.'
      );
      process.exit(1);
      return;
    }

    await seedDatabase();
    console.log('Seed data applied successfully.');
    process.exit(0);
  } catch (objError) {
    console.error('Seed operation failed:', objError);
    process.exit(1);
  }
};

runSeed();

