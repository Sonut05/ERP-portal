import serverless from 'serverless-http';
import app from '../../backend/src/server';
import { initDatabase } from '../../backend/src/config/db';

let dbInitialized = false;

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (err) {
      console.error('Failed to initialize database in Netlify Function:', err);
    }
  }

  // Normalize Netlify function path to match Express routes (/api/...)
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '/api');
  }

  return serverlessHandler(event, context);
};

export const config = {
  path: ["/api/*", "/.netlify/functions/api/*"]
};
