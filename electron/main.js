const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { app, BrowserWindow } = require('electron');

// Load .env before reading PORT/DB_PATH so desktop and web can share config.
dotenv.config();

// Keep default desktop port explicit so Electron startup logic is predictable.
const intDefaultServerPort = 3000;
const intServerPort = Number(process.env.ELECTRON_SERVER_PORT || process.env.PORT) || intDefaultServerPort;
const strServerBaseUrl = `http://localhost:${intServerPort}`;
const strServerHealthUrl = `${strServerBaseUrl}/api/health`;
const strProjectRootPath = path.resolve(__dirname, '..');

let objMainWindow = null;
let objServerRuntime = null;
let blnElectronStartedServer = false;

const wait = async (intDelayMs) => new Promise((resolve) => {
  setTimeout(resolve, intDelayMs);
});

const isLocalServerHealthy = async () => {
  const objAbortController = new AbortController();
  const intTimeoutId = setTimeout(() => objAbortController.abort(), 1500);

  try {
    const objResponse = await fetch(strServerHealthUrl, {
      method: 'GET',
      signal: objAbortController.signal
    });
    return objResponse.ok;
  } catch (_objError) {
    return false;
  } finally {
    clearTimeout(intTimeoutId);
  }
};

const ensureDesktopDbPath = () => {
  // Desktop mode stores data in userData by default.
  // If DB_PATH is already set, we keep that explicit override.
  if (!String(process.env.DB_PATH || '').trim()) {
    process.env.DB_PATH = path.join(app.getPath('userData'), 'resume_builder.db');
  }
};

const resolveRuntimeDbPath = () => {
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

const startEmbeddedServerIfNeeded = async () => {
  const blnServerAlreadyRunning = await isLocalServerHealthy();
  if (blnServerAlreadyRunning) {
    console.log(`Electron detected running server at ${strServerBaseUrl}.`);
    return;
  }

  ensureDesktopDbPath();
  const strResolvedDbPath = resolveRuntimeDbPath();
  const blnSeedOnInitialize = !fs.existsSync(strResolvedDbPath);
  const { startServer } = require('../server');

  objServerRuntime = await startServer({
    intPort: intServerPort,
    blnExitOnError: false,
    blnSeedOnInitialize
  });
  blnElectronStartedServer = true;

  // Give Express a short readiness buffer before BrowserWindow loads.
  for (let intAttempt = 0; intAttempt < 10; intAttempt += 1) {
    if (await isLocalServerHealthy()) {
      return;
    }

    await wait(150);
  }

  throw new Error(`Server did not become healthy at ${strServerHealthUrl}.`);
};

const createMainWindow = async () => {
  objMainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  await objMainWindow.loadURL(strServerBaseUrl);
};

const shutdownEmbeddedServer = async () => {
  if (!blnElectronStartedServer || !objServerRuntime || typeof objServerRuntime.close !== 'function') {
    return;
  }

  try {
    await objServerRuntime.close();
  } catch (objError) {
    console.error('Failed to close embedded server cleanly:', objError);
  } finally {
    objServerRuntime = null;
    blnElectronStartedServer = false;
  }
};

app.on('ready', async () => {
  try {
    await startEmbeddedServerIfNeeded();
    await createMainWindow();
  } catch (objError) {
    console.error('Electron startup failed:', objError);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', async () => {
  await shutdownEmbeddedServer();
});
