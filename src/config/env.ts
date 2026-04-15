/**
 * App Configuration and Environment Variables
 * 
 * IMPORTANT: Only include variables that are safe for the client-side.
 * Server-side secrets like Private Keys or API Secrets should NEVER be 
 * included in the mobile application as they can be extracted by users.
 */

export const ENV = {
  // Firebase configuration (Redundant but sometimes useful for JS SDK)
  FIREBASE: {
    API_KEY: 'AIzaSyBoePwg-9cPq7Jg5lvF5qQHJjclmZXF1Hc',
    AUTH_DOMAIN: 'lms-project-418ee.firebaseapp.com',
    PROJECT_ID: 'lms-project-418ee',
    STORAGE_BUCKET: 'lms-project-418ee.firebasestorage.app',
    MESSAGING_SENDER_ID: '146404897369',
    APP_ID: '1:146404897369:web:7d8641227e2406e5567748',
  },

  // Cloudinary Configuration
  CLOUDINARY: {
    CLOUD_NAME: 'drkgxobb3',
    UPLOAD_PRESET: 'lms-project',
  },

  // Backend API URL (Your Vercel Deployment)
  API_URL: 'https://lms-project-with-next.vercel.app',
};
