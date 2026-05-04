const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');

const { initializeDatabase } = require('./services/database.service');
const { sendError } = require('./utils/responseHelpers');

const profileRoutes = require('./api/routing/profile.routes');
const educationRoutes = require('./api/routing/education.routes');
const experienceRoutes = require('./api/routing/experience.routes');
const skillsRoutes = require('./api/routing/skills.routes');
const certificationsRoutes = require('./api/routing/certifications.routes');
const awardsRoutes = require('./api/routing/awards.routes');
const resumesRoutes = require('./api/routing/resumes.routes');
const aiRoutes = require('./api/routing/ai.routes');
const settingsRoutes = require('./api/routing/settings.routes');

dotenv.config();

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', (_objRequest, objResponse) => {
    objResponse.json({
      status: 'ok',
      message: 'Resume Builder API is running.'
    });
  });

  app.use('/api/profile', profileRoutes);
  app.use('/api/education', educationRoutes);
  app.use('/api/experience', experienceRoutes);
  app.use('/api/skills', skillsRoutes);
  app.use('/api/certifications', certificationsRoutes);
  app.use('/api/awards', awardsRoutes);
  app.use('/api/resumes', resumesRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use('/api', (_objRequest, objResponse) => {
    sendError(objResponse, 404, 'API route not found.');
  });

  app.get(/.*/, (_objRequest, objResponse) => {
    objResponse.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use((objError, _objRequest, objResponse, _fnNext) => {
    console.error('Unhandled error:', objError);
    sendError(objResponse, 500, 'An unexpected server error occurred.');
  });

  return app;
};

const startServer = async (objOptions = {}) => {
  const intConfiguredPort = Number(objOptions.intPort || process.env.PORT) || 3000;
  const blnExitOnError = objOptions.blnExitOnError !== false;
  const blnSeedOnInitialize = objOptions.blnSeedOnInitialize === true;
  const app = createApp();

  try {
    await initializeDatabase({
      blnSeedOnInitialize
    });

    const httpServer = await new Promise((resolve, reject) => {
      const objServer = app.listen(intConfiguredPort, () => {
        console.log(`Resume Builder server is running on http://localhost:${intConfiguredPort}`);
        resolve(objServer);
      });

      objServer.on('error', (objError) => {
        reject(objError);
      });
    });

    return {
      app,
      httpServer,
      intPort: intConfiguredPort,
      close: () => new Promise((resolve, reject) => {
        httpServer.close((objError) => {
          if (objError) {
            reject(objError);
            return;
          }

          resolve();
        });
      })
    };
  } catch (objError) {
    console.error('Failed to start server:', objError);

    if (blnExitOnError) {
      process.exit(1);
    }

    throw objError;
  }
};

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer
};

