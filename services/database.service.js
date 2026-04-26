const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// This module manages a single shared SQLite connection for the whole app.
// Using one connection helps keep setup simple for a class project.
let objDatabase = null;

const strResolvedDbPath = path.resolve(
  process.cwd(),
  process.env.DB_PATH || './db/resume_builder.db'
);

const strSchemaPath = path.resolve(process.cwd(), 'db', 'schema.sql');

const connectDatabase = async () => {
  if (objDatabase) {
    return objDatabase;
  }

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

const initializeDatabase = async () => {
  await connectDatabase();

  // Foreign keys are disabled by default in SQLite, so we enable them explicitly.
  await executeSql('PRAGMA foreign_keys = ON;');

  if (!fs.existsSync(strSchemaPath)) {
    throw new Error(`Schema file not found at path: ${strSchemaPath}`);
  }

  const strSchemaSql = fs.readFileSync(strSchemaPath, 'utf8');
  await executeSql(strSchemaSql);
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
  connectDatabase,
  all,
  get,
  run
};
