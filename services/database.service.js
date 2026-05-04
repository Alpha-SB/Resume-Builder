const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// This module manages a single shared SQLite connection for the whole app.
// Using one connection helps keep setup simple for a class project.
let objDatabase = null;

// Resolve from module location so runtime does not depend on process.cwd().
const strProjectRootPath = path.resolve(__dirname, '..');

const resolveDbPath = () => {
  const strConfiguredDbPath = String(process.env.DB_PATH || '').trim();
  const strDefaultRelativeDbPath = path.join('db', 'resume_builder.db');

  if (!strConfiguredDbPath) {
    return path.resolve(strProjectRootPath, strDefaultRelativeDbPath);
  }

  if (path.isAbsolute(strConfiguredDbPath)) {
    return strConfiguredDbPath;
  }

  return path.resolve(strProjectRootPath, strConfiguredDbPath);
};

const resolveSchemaPath = () => path.resolve(strProjectRootPath, 'db', 'schema.sql');
const resolveSeedPath = () => path.resolve(strProjectRootPath, 'db', 'seed.sql');

const connectDatabase = async () => {
  if (objDatabase) {
    return objDatabase;
  }

  const strResolvedDbPath = resolveDbPath();

  // Ensure the DB folder exists before SQLite tries to open the file.
  const strDbDirectory = path.dirname(strResolvedDbPath);
  fs.mkdirSync(strDbDirectory, { recursive: true });

  objDatabase = await new Promise((resolve, reject) => {
    const objNewDatabase = new sqlite3.Database(strResolvedDbPath, (objError) => {
      if (objError) {
        reject(objError);
        return;
      }

      resolve(objNewDatabase);
    });
  });

  return objDatabase;
};

const executeSql = async (strSql) => {
  const objConnectedDatabase = await connectDatabase();

  await new Promise((resolve, reject) => {
    objConnectedDatabase.exec(strSql, (objError) => {
      if (objError) {
        reject(objError);
        return;
      }

      resolve();
    });
  });
};

const seedDatabase = async () => {
  const strSeedPath = resolveSeedPath();
  if (!fs.existsSync(strSeedPath)) {
    throw new Error(`Seed file not found at path: ${strSeedPath}`);
  }

  // The seed SQL file contains starter demo records used for local-first workflows.
  const strSeedSql = fs.readFileSync(strSeedPath, 'utf8');
  await executeSql(strSeedSql);
};

const initializeDatabase = async (objOptions = {}) => {
  const blnSeedOnInitialize = objOptions.blnSeedOnInitialize === true;
  await connectDatabase();

  // Foreign keys are disabled by default in SQLite, so we enable them explicitly.
  await executeSql('PRAGMA foreign_keys = ON;');

  const strSchemaPath = resolveSchemaPath();
  if (!fs.existsSync(strSchemaPath)) {
    throw new Error(`Schema file not found at path: ${strSchemaPath}`);
  }

  const strSchemaSql = fs.readFileSync(strSchemaPath, 'utf8');
  await executeSql(strSchemaSql);

  if (!blnSeedOnInitialize) {
    return;
  }

  // Seed data is applied only when caller explicitly requests it (desktop first run).
  // This keeps web/server startup behavior unchanged for regular development workflows.
  await seedDatabase();
};

const all = async (strSql, arrParams = []) => {
  const objConnectedDatabase = await connectDatabase();

  return new Promise((resolve, reject) => {
    objConnectedDatabase.all(strSql, arrParams, (objError, arrRows) => {
      if (objError) {
        reject(objError);
        return;
      }

      resolve(arrRows);
    });
  });
};

const get = async (strSql, arrParams = []) => {
  const objConnectedDatabase = await connectDatabase();

  return new Promise((resolve, reject) => {
    objConnectedDatabase.get(strSql, arrParams, (objError, objRow) => {
      if (objError) {
        reject(objError);
        return;
      }

      resolve(objRow);
    });
  });
};

const run = async (strSql, arrParams = []) => {
  const objConnectedDatabase = await connectDatabase();

  return new Promise((resolve, reject) => {
    objConnectedDatabase.run(strSql, arrParams, function onRunComplete(objError) {
      if (objError) {
        reject(objError);
        return;
      }

      // Returning both last inserted ID and affected row count is helpful for CRUD endpoints.
      resolve({
        intLastId: this.lastID,
        intChanges: this.changes
      });
    });
  });
};

module.exports = {
  initializeDatabase,
  seedDatabase,
  connectDatabase,
  all,
  get,
  run
};
