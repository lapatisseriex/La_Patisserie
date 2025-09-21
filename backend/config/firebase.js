import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Create service account credential from environment variables
let serviceAccount;
try {
  // Clean up the private key by removing extra escapes and formatting it properly
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    // Remove quotes if present
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    // Replace \\n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    // Ensure proper format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Private key format is invalid');
    }
  }

  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
    universe_domain: "googleapis.com"
  };
} catch (error) {
  console.error('Error setting up Firebase service account:', error);
  // Use minimal configuration as fallback
  serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };
}

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.log('Attempting to initialize with application default credentials...');
  try {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log('Firebase initialized with application default credentials');
  } catch (fallbackError) {
    console.error('All Firebase initialization methods failed:', fallbackError);
  }
}

export default admin;
